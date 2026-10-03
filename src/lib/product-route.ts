import snapshot from "@/data/catalog-snapshot.json";
import { catalogSlug } from "./title-overrides";

type StoredProduct = { id: number; name: string; slug: string };

const byId = new Map<number, StoredProduct>();
for (const product of (snapshot as { products: StoredProduct[] }).products) {
  byId.set(product.id, {
    id: product.id,
    name: product.name,
    slug: product.slug,
  });
}

/**
 * One hop from a stale product slug to the current public slug.
 * Returns null when the request is already canonical, so a disabled title
 * override serves the stored Printful slug instead of redirecting it.
 */
export function productSlugRedirect(pathname: string): string | null {
  const match = pathname.match(/^\/products\/([^/]+)\/?$/);
  if (!match) return null;
  let requested: string;
  try {
    requested = decodeURIComponent(match[1]);
  } catch {
    return null;
  }
  const idText = requested.match(/-(\d{1,15})$/)?.[1];
  if (!idText) return null;
  const product = byId.get(Number(idText));
  if (!product) return null;
  const canonical = catalogSlug(product.id, product.name, product.slug);
  if (requested === canonical) return null;
  return `/products/${canonical}`;
}
