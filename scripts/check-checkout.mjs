import pg from "pg";
import Stripe from "stripe";

const checks = [];
const add = (name, ok, detail) =>
  checks.push({ name, ok: Boolean(ok), ...(detail ? { detail } : {}) });

const printfulToken =
  process.env.PRINTFUL_API_TOKEN || process.env.PRINTFUL_API_KEY;
add("PRINTFUL_API_TOKEN", Boolean(printfulToken), printfulToken
  ? process.env.PRINTFUL_API_TOKEN
    ? "PRINTFUL_API_TOKEN"
    : "PRINTFUL_API_KEY alias"
  : "set PRINTFUL_API_TOKEN or PRINTFUL_API_KEY");
add("PRINTFUL_STORE_ID", /^\d+$/.test(process.env.PRINTFUL_STORE_ID ?? ""));
add("SITE_URL", Boolean(process.env.SITE_URL));
add(
  "STRIPE_SECRET_KEY",
  /^[rs]k_(test|live)_/.test(process.env.STRIPE_SECRET_KEY ?? ""),
);
add("STRIPE_WEBHOOK_SECRET", Boolean(process.env.STRIPE_WEBHOOK_SECRET));
add(
  "checkout_enabled",
  process.env.CHECKOUT_ENABLED !== "false",
  process.env.CHECKOUT_ENABLED === "false"
    ? "explicitly disabled"
    : "on when Stripe secret is present",
);
add(
  "APP_SESSION_SECRET",
  (process.env.APP_SESSION_SECRET?.length ?? 0) >= 32 ||
    (process.env.STRIPE_SECRET_KEY?.length ?? 0) >= 32,
  "dedicated secret or Stripe secret fallback",
);
add(
  "production_origin",
  !process.env.SITE_URL ||
    process.env.SITE_URL === "https://hustlerdior.com",
);
add(
  "DATABASE_URL",
  true,
  process.env.DATABASE_URL
    ? "durable order store"
    : "optional; in-memory quotes + Stripe metadata recovery",
);

if (process.env.DATABASE_URL) {
  const db = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    statement_timeout: 10000,
  });
  try {
    await db.connect();
    const { rows } = await db.query(
      "SELECT name, to_regclass('public.' || name) IS NOT NULL AS present FROM unnest($1::text[]) AS name",
      [["hd_orders", "hd_payment_jobs", "hd_usage", "hd_support_requests"]],
    );
    for (const row of rows) add(`database.${row.name}`, row.present);
  } catch {
    add(
      "database.connection",
      false,
      "Connection or schema inspection failed; credentials omitted.",
    );
  } finally {
    await db.end().catch(() => {});
  }
}

if (/^[rs]k_(test|live)_/.test(process.env.STRIPE_SECRET_KEY ?? "")) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-08-26.dahlia",
    timeout: 15000,
    maxNetworkRetries: 0,
  });
  try {
    const [settings, registrations] = await Promise.all([
      stripe.tax.settings.retrieve(),
      stripe.tax.registrations.list({ status: "active", limit: 1 }),
    ]);
    add(
      "stripe.tax_settings",
      process.env.STRIPE_TAX_MODE !== "automatic" || settings.status === "active",
      "optional unless STRIPE_TAX_MODE=automatic",
    );
    add(
      "stripe.tax_classification",
      process.env.STRIPE_TAX_MODE !== "automatic" ||
        Boolean(settings.defaults.tax_code),
      "optional unless STRIPE_TAX_MODE=automatic",
    );
    add(
      "stripe.tax_registration",
      process.env.STRIPE_TAX_MODE !== "automatic" ||
        registrations.data.length > 0,
      "This checks the application's present requirement; it does not determine legal registration obligations.",
    );
  } catch {
    add(
      "stripe.configuration_read",
      process.env.STRIPE_TAX_MODE !== "automatic",
      "Credential or permission check failed; provider details omitted.",
    );
  }
}

const configured = checks.every((check) => check.ok);
console.log(
  JSON.stringify(
    {
      configured,
      checks,
      note: "Configuration checks only. Verify checkout, webhook signatures, retail margins, shipping and merchant policies before launch. No charge or order was created. Do not invent secret values.",
    },
    null,
    2,
  ),
);
process.exitCode = configured ? 0 : 1;
