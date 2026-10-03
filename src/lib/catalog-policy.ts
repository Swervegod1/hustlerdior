import type { Product, ProductVariant } from "./types";
import prices from "@/data/price-overrides.json";
import { catalogSlug } from "./title-overrides";

/**
 * Columbia fleece vest. Removed until the blank can be fulfilled again.
 * Its product URL is a real 404.
 */
export const REMOVED_PRODUCT_IDS = new Set<number>([471748994]);

/**
 * Stone / 2XL on the organic oversized high-neck tee.
 * Printful catalog variant 21028 cannot be fulfilled.
 */
export const HIDDEN_CATALOG_VARIANT_IDS = new Set<number>([21028]);

type PriceRow = { productId: number; variantId: number; price: string };

function priceToCents(price: string) {
  if (!/^\d+\.\d{2}$/.test(price)) return null;
  const [whole, fraction] = price.split(".");
  const cents = Number(whole) * 100 + Number(fraction);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

const priceByVariant = new Map<string, number>();
if (prices.enabled) {
  for (const row of prices.overrides as PriceRow[]) {
    const cents = priceToCents(row.price);
    if (cents !== null)
      priceByVariant.set(`${row.productId}:${row.variantId}`, cents);
  }
}

/** Set `enabled` to false in price-overrides.json to restore Printful retail prices. */
export function priceOverridesEnabled() {
  return prices.enabled === true;
}

function priceRange(variants: ProductVariant[]) {
  const purchasable = variants.filter(
    (variant) => variant.stock === "available",
  );
  const amounts = (purchasable.length ? purchasable : variants).map(
    (variant) => variant.priceCents,
  );
  return {
    priceCents: Math.min(...amounts),
    maxPriceCents: Math.max(...amounts),
  };
}

/**
 * One catalog pass for storefront, JSON-LD, and checkout.
 * An active title override replaces the public slug via productSlug(title, id).
 * Prices change only while the price override file is enabled.
 * The Printful name stays on the product so checkout line items are unchanged.
 */
export function applyCatalogPolicy(product: Product): Product | null {
  if (REMOVED_PRODUCT_IDS.has(product.id)) return null;
  const variants = product.variants.flatMap((variant) => {
    if (HIDDEN_CATALOG_VARIANT_IDS.has(variant.catalogVariantId)) return [];
    const cents = priceByVariant.get(`${product.id}:${variant.id}`);
    return [cents === undefined ? variant : { ...variant, priceCents: cents }];
  });
  if (!variants.length) return null;
  return {
    ...product,
    slug: catalogSlug(product.id, product.name, product.slug),
    variants,
    ...priceRange(variants),
  };
}

/** Cents checkout copies onto a Stripe line item. Same field the page renders. */
export function unitPriceCents(product: Product, variantId: number) {
  return (
    product.variants.find((variant) => variant.id === variantId)?.priceCents ??
    null
  );
}
