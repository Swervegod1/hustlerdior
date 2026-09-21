/** Runtime env shape for Hostinger Node deploys. Never invent or log secret values. */

export function printfulToken() {
  return process.env.PRINTFUL_API_TOKEN || process.env.PRINTFUL_API_KEY || "";
}

export function printfulConfigured() {
  const store = process.env.PRINTFUL_STORE_ID ?? "";
  return Boolean(printfulToken() && /^\d+$/.test(store));
}

export function stripeSecret() {
  return process.env.STRIPE_SECRET_KEY ?? "";
}

export function stripeKeyValid(key = stripeSecret()) {
  return /^[rs]k_(test|live)_/.test(key);
}

/** Checkout is on whenever a valid Stripe secret is present, unless explicitly disabled. */
export function checkoutConfigured() {
  return process.env.CHECKOUT_ENABLED !== "false" && stripeKeyValid();
}

export function sessionSecret() {
  const dedicated = process.env.APP_SESSION_SECRET;
  if (dedicated && dedicated.length >= 32) return dedicated;
  const stripe = stripeSecret();
  return stripe.length >= 32 ? stripe : "";
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

/** Snapshot is visual-only. Live Printful wins whenever the store token is set. */
export function catalogUsesSnapshot() {
  return process.env.CATALOG_SNAPSHOT_PREVIEW === "true" && !printfulConfigured();
}
