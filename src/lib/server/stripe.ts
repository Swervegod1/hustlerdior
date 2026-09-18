import "server-only";
import Stripe from "stripe";
import { HttpError } from "./http";
export const INTEGRATION_ID = "hustlerdior_QuvNerZa";
export function stripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey || !/^[rs]k_(test|live)_/.test(apiKey))
    throw new HttpError(503, "Checkout is being prepared. Your bag is saved.");
  return new Stripe(apiKey, {
    apiVersion: "2026-08-26.dahlia",
    maxNetworkRetries: 1,
    timeout: 15000,
  });
}
export function checkoutConfigured() {
  return (
    process.env.CHECKOUT_ENABLED === "true" &&
    !!process.env.STRIPE_SECRET_KEY &&
    !!process.env.STRIPE_WEBHOOK_SECRET &&
    !!process.env.DATABASE_URL &&
    (process.env.APP_SESSION_SECRET?.length ?? 0) >= 32
  );
}
export function checkoutTaxMode() {
  const live = /_live_/.test(process.env.STRIPE_SECRET_KEY ?? "");
  const mode = process.env.STRIPE_TAX_MODE;
  if (mode === "automatic") return { mode, live } as const;
  if (mode === "test_none" && !live) return { mode, live } as const;
  throw new HttpError(503, "Checkout is being prepared. Your bag is saved.");
}
export async function verifyTaxConfiguration() {
  const config = checkoutTaxMode();
  if (config.mode === "automatic") {
    const stripe = stripeClient();
    const [registrations, settings] = await Promise.all([
      stripe.tax.registrations.list({ status: "active", limit: 1 }),
      stripe.tax.settings.retrieve(),
    ]);
    if (!registrations.data.length || settings.status !== "active")
      throw new HttpError(
        503,
        "Checkout is being prepared. Your bag is saved.",
      );
    // Product tax codes use the merchant's verified Stripe Tax default preset. No invented tax code.
    if (!settings.defaults.tax_code)
      throw new HttpError(
        503,
        "Checkout is being prepared. Your bag is saved.",
      );
  }
  return config;
}
