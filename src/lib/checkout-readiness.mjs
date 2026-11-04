/** Shared by runtime and operator check. Flags are attestations, not health probes.
 * @param {Record<string, string | undefined>} env
 */
export function checkoutRequirements(env = process.env) {
  return {
    CHECKOUT_ENABLED: env.CHECKOUT_ENABLED === "true",
    STRIPE_SECRET_KEY: /^[rs]k_(test|live)_/.test(env.STRIPE_SECRET_KEY ?? ""),
    PRINTFUL_CONFIGURATION: Boolean(
      (env.PRINTFUL_API_TOKEN || env.PRINTFUL_API_KEY) &&
      /^\d+$/.test(env.PRINTFUL_STORE_ID ?? ""),
    ),
    DATABASE_URL: Boolean(env.DATABASE_URL),
    PAYMENT_WORKER_READY: env.PAYMENT_WORKER_READY === "true",
    STORE_POLICIES_APPROVED: env.STORE_POLICIES_APPROVED === "true",
  };
}
