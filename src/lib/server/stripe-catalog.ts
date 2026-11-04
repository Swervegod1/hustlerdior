import "server-only";
import type Stripe from "stripe";
import manifest from "@/data/stripe-catalog.json";
import { assertMappedPrice, type CatalogManifest } from "../stripe-catalog";
import type { OrderSnapshot } from "../commerce-schema";
import { stripeSecret } from "../env";
import { HttpError } from "./http";

export async function resolveCatalogPrices(
  stripe: Stripe,
  lines: OrderSnapshot["lines"],
  catalogData: CatalogManifest = manifest as CatalogManifest,
) {
  try {
    const live = /_live_/.test(stripeSecret());
    const catalogs = catalogData.catalogs.filter(
      (c) =>
        c.complete &&
        c.livemode === live &&
        c.storeId === process.env.PRINTFUL_STORE_ID,
    );
    if (catalogs.length !== 1)
      throw new Error("Missing or ambiguous catalog scope");
    const catalog = catalogs[0];
    const account = await stripe.accounts.retrieve(null);
    if (account.id !== catalog.accountId || (live && !account.charges_enabled))
      throw new Error("Stripe account mismatch");
    const resolved = [];
    for (const line of lines) {
      const matches = catalog.entries.filter(
        (m) => m.productId === line.productId && m.variantId === line.variantId,
      );
      if (matches.length !== 1)
        throw new Error("Missing or ambiguous variant mapping");
      const mapping = matches[0];
      if (
        mapping.unitAmount !== line.priceCents ||
        mapping.currency !== line.currency.toLowerCase()
      )
        throw new Error("Imported price has changed");
      const price = await stripe.prices.retrieve(mapping.priceId, {
        expand: ["product"],
      });
      assertMappedPrice(price, mapping, catalog);
      resolved.push({ price: price.id, quantity: line.quantity });
    }
    return resolved;
  } catch {
    throw new HttpError(
      503,
      "Checkout pricing is being verified. Please try again later.",
    );
  }
}
