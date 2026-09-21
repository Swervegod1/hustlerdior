import type { Product } from "./types";

export const CANONICAL_ORIGIN = "https://hustlerdior.com";

export function absoluteUrl(path = "/") {
  // The main domain stays canonical even on previews and recovery instances.
  if (!path.startsWith("/") || path.startsWith("//"))
    throw new Error("Expected a site-relative path");
  return new URL(path, CANONICAL_ORIGIN).href;
}

export function isIndexable(
  env: Record<string, string | undefined> = process.env,
) {
  const publicOrigin = (() => {
    try {
      return new URL(env.SITE_URL || "").origin;
    } catch {
      return "";
    }
  })();
  return (
    env.SITE_ROLE === "primary" &&
    env.SEARCH_INDEXING === "true" &&
    env.CATALOG_SNAPSHOT_PREVIEW !== "true" &&
    publicOrigin === CANONICAL_ORIGIN
  );
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function productDescription(product: Product) {
  const colors = new Set(product.variants.map((v) => v.color)).size;
  const sizes = new Set(product.variants.map((v) => v.size)).size;
  return `${product.name} by Hustler Dior. Explore ${colors} color ${colors === 1 ? "option" : "options"} and ${sizes} ${sizes === 1 ? "size" : "sizes"}. View current variant pricing and availability.`;
}

export function breadcrumbData(crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function productData(product: Product) {
  const path = `/products/${product.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    "@id": `${absoluteUrl(path)}#product`,
    url: absoluteUrl(path),
    name: product.name,
    description: productDescription(product),
    productGroupID: `HD-${product.id}`,
    brand: { "@type": "Brand", name: "Hustler Dior" },
    category: product.category,
    image: product.image ? [product.image] : undefined,
    variesBy: ["https://schema.org/size", "https://schema.org/color"],
    hasVariant: product.variants.map((v) => ({
      "@type": "Product",
      "@id": `${absoluteUrl(path)}#variant-${v.id}`,
      name: v.name,
      sku: `HD-${v.id}`,
      size: v.size,
      color: v.color,
      url: absoluteUrl(`${path}?variant=${v.id}`),
      image: v.image ? [v.image] : undefined,
      // No Offer until a working checkout and actual shipping/returns policies exist.
      // Synced catalog prices alone do not establish a purchasable Google merchant listing.
    })),
  };
}
