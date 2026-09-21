import "server-only";
import Stripe from "stripe";
import { HttpError } from "./http";
import { checkoutConfigured, stripeKeyValid, stripeSecret } from "../env";
export const INTEGRATION_ID = "hustlerdior_QuvNerZa";
export { checkoutConfigured };
export function stripeClient() {
  const apiKey = stripeSecret();
  if (!stripeKeyValid(apiKey))
    throw new HttpError(
      503,
      "Online payment is not configured on this storefront.",
    );
  return new Stripe(apiKey, {
    apiVersion: "2026-08-26.dahlia",
    maxNetworkRetries: 1,
    timeout: 15000,
  });
}
export function checkoutTaxMode() {
  const live = /_live_/.test(stripeSecret());
  const mode = process.env.STRIPE_TAX_MODE;
  if (mode === "automatic") return { mode, live } as const;
  return { mode: "test_none" as const, live };
}
export async function verifyTaxConfiguration() {
  const config = checkoutTaxMode();
  if (config.mode !== "automatic") return config;
  try {
    const stripe = stripeClient();
    const [registrations, settings] = await Promise.all([
      stripe.tax.registrations.list({ status: "active", limit: 1 }),
      stripe.tax.settings.retrieve(),
    ]);
    if (
      !registrations.data.length ||
      settings.status !== "active" ||
      !settings.defaults.tax_code
    )
      return { mode: "test_none" as const, live: config.live };
  } catch {
    return { mode: "test_none" as const, live: config.live };
  }
  return config;
}
