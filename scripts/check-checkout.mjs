import pg from "pg";
import Stripe from "stripe";
import { readFile } from "node:fs/promises";
import { checkoutRequirements } from "../src/lib/checkout-readiness.mjs";

const checks = [];
const add = (name, ok, detail) =>
  checks.push({ name, ok: Boolean(ok), ...(detail ? { detail } : {}) });
const requirements = checkoutRequirements();
for (const [name, ok] of Object.entries(requirements))
  add(
    name,
    ok,
    name === "PAYMENT_WORKER_READY" || name === "STORE_POLICIES_APPROVED"
      ? "Operator attestation; independently verify before setting true"
      : undefined,
  );
add("SITE_URL", process.env.SITE_URL === "https://hustlerdior.com");
add(
  "STRIPE_WEBHOOK_SECRET",
  /^whsec_/.test(process.env.STRIPE_WEBHOOK_SECRET ?? ""),
);
add(
  "CRON_SECRET",
  (process.env.CRON_SECRET?.length ?? 0) >= 32,
  "Required by the authenticated HTTP worker; does not prove a schedule exists",
);
add(
  "APP_SESSION_SECRET",
  (process.env.APP_SESSION_SECRET?.length ?? 0) >= 32 ||
    (process.env.STRIPE_SECRET_KEY?.length ?? 0) >= 32,
);

if (requirements.DATABASE_URL) {
  const db = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    statement_timeout: 10000,
  });
  try {
    await db.connect();
    const { rows } = await db.query(
      "SELECT name,to_regclass('public.' || name) IS NOT NULL AS present FROM unnest($1::text[]) AS name",
      [["hd_orders", "hd_payment_jobs", "hd_usage", "hd_support_requests"]],
    );
    for (const row of rows) add(`database.${row.name}`, row.present);
    add("database.connection", true);
  } catch {
    add(
      "database.connection",
      false,
      "Connection/schema inspection failed; credentials omitted",
    );
  } finally {
    await db.end().catch(() => {});
  }
}

let stripeAccountId = null,
  livemode = null;
if (requirements.STRIPE_SECRET_KEY) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-08-26.dahlia",
    timeout: 15000,
    maxNetworkRetries: 1,
  });
  try {
    const account = await stripe.accounts.retrieve(null);
    const balance = await stripe.balance.retrieve();
    stripeAccountId = account.id;
    livemode = balance.livemode;
    add("stripe.authentication", true);
    add(
      "stripe.key_mode",
      livemode === /_live_/.test(process.env.STRIPE_SECRET_KEY),
    );
    add("stripe.charges_enabled", !livemode || account.charges_enabled);
    const manifest = JSON.parse(
      await readFile(
        new URL("../src/data/stripe-catalog.json", import.meta.url),
        "utf8",
      ),
    );
    const catalogs = manifest.catalogs.filter(
      (c) =>
        c.complete &&
        c.storeId === process.env.PRINTFUL_STORE_ID &&
        c.livemode === livemode,
    );
    add(
      "stripe.catalog_account",
      catalogs.length === 1 && catalogs[0].accountId === account.id,
    );
    add(
      "stripe.catalog_mappings",
      catalogs.length === 1 && catalogs[0].entries.length > 0,
      "Individual Prices are revalidated at checkout",
    );
    const required = [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.async_payment_failed",
      "checkout.session.expired",
    ];
    const endpoints = [];
    for await (const endpoint of stripe.webhookEndpoints.list({ limit: 100 }))
      endpoints.push(endpoint);
    add(
      "stripe.webhook_endpoint",
      endpoints.some(
        (e) =>
          e.status === "enabled" &&
          e.livemode === livemode &&
          e.url === "https://hustlerdior.com/api/webhooks/stripe" &&
          required.every(
            (t) =>
              e.enabled_events.includes(t) || e.enabled_events.includes("*"),
          ),
      ),
      "Endpoint configuration only; does not verify the stored signing secret or event delivery",
    );
    if (process.env.STRIPE_TAX_MODE === "automatic") {
      const [settings, registrations] = await Promise.all([
        stripe.tax.settings.retrieve(),
        stripe.tax.registrations.list({ status: "active", limit: 1 }),
      ]);
      add(
        "stripe.tax_settings",
        settings.status === "active" && !!settings.defaults.tax_code,
      );
      add(
        "stripe.tax_registration",
        registrations.data.length > 0,
        "Checks the current application requirement; does not determine registration obligations",
      );
    }
  } catch {
    add(
      "stripe.configuration_read",
      false,
      "Authentication, account, catalog, webhook or tax verification failed; provider details omitted",
    );
  }
}
if (requirements.PRINTFUL_CONFIGURATION) {
  try {
    const response = await fetch("https://api.printful.com/stores", {
      headers: {
        Authorization: `Bearer ${process.env.PRINTFUL_API_TOKEN || process.env.PRINTFUL_API_KEY}`,
      },
      signal: AbortSignal.timeout(15000),
    });
    const body = await response.json();
    add(
      "printful.store_access",
      response.ok &&
        Array.isArray(body.result) &&
        body.result.some((s) => String(s.id) === process.env.PRINTFUL_STORE_ID),
    );
  } catch {
    add(
      "printful.store_access",
      false,
      "Store authentication failed; credentials omitted",
    );
  }
}
const configured = checks.every((c) => c.ok);
console.log(
  JSON.stringify(
    {
      configured,
      runtimeGateEnabled: Object.values(requirements).every(Boolean),
      stripeAccountId,
      livemode,
      checks,
      note: "Read-only configuration checks. Worker recovery, signed webhook replay, sandbox purchases, fulfillment margins and owner-approved policies require independent evidence. No payment or fulfillment order was created.",
    },
    null,
    2,
  ),
);
process.exitCode = configured ? 0 : 1;
