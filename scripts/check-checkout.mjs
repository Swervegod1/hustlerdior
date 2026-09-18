import pg from "pg";
import Stripe from "stripe";

const checks = [];
const add = (name, ok, detail) =>
  checks.push({ name, ok: Boolean(ok), ...(detail ? { detail } : {}) });
for (const name of [
  "DATABASE_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "PRINTFUL_API_TOKEN",
  "PRINTFUL_STORE_ID",
])
  add(name, Boolean(process.env[name]));
for (const name of ["APP_SESSION_SECRET", "CRON_SECRET"])
  add(name, (process.env[name]?.length ?? 0) >= 32);
add("production_origin", process.env.SITE_URL === "https://hustlerdior.com");
add("checkout_flag", process.env.CHECKOUT_ENABLED === "true");
add("live_tax_mode", process.env.STRIPE_TAX_MODE === "automatic");

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
    add("stripe.tax_settings", settings.status === "active");
    add("stripe.tax_classification", Boolean(settings.defaults.tax_code));
    add(
      "stripe.tax_registration",
      registrations.data.length > 0,
      "This checks the application's present requirement; it does not determine legal registration obligations.",
    );
  } catch {
    add(
      "stripe.configuration_read",
      false,
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
      note: "Configuration checks only. Verify checkout, webhook signatures, scheduled worker, retail margins, shipping and merchant policies before launch. No charge or order was created.",
    },
    null,
    2,
  ),
);
process.exitCode = configured ? 0 : 1;
