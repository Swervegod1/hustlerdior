import type { Product } from "./types";

export const CANONICAL_ORIGIN = "https://hustlerdior.com";

const PRODUCTION_HOSTS = new Set(["hustlerdior.com", "www.hustlerdior.com"]);

export function absoluteUrl(path = "/") {
  // The main domain stays canonical even on previews and recovery instances.
  if (!path.startsWith("/") || path.startsWith("//"))
    throw new Error("Expected a site-relative path");
  return new URL(path, CANONICAL_ORIGIN).href;
}

export function normalizeHost(value: string) {
  return value.toLowerCase().split(",")[0]?.trim().replace(/:\d+$/, "") ?? "";
}

export function isProductionHost(host: string) {
  return PRODUCTION_HOSTS.has(normalizeHost(host));
}

/** Prefer a forwarded public host when the app process only sees an internal listener. */
export function publicHostFrom(headers: { get(name: string): string | null }) {
  const forwarded = normalizeHost(headers.get("x-forwarded-host") || "");
  const host = normalizeHost(headers.get("host") || "");
  if (isProductionHost(forwarded)) return forwarded;
  if (isProductionHost(host)) return host;
  return forwarded || host;
}

function siteOrigin(env: Record<string, string | undefined>) {
  try {
    return new URL(env.SITE_URL || "").origin;
  } catch {
    return "";
  }
}

function isInternalHost(hostname: string) {
  if (!hostname) return true;
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return true;
  if (hostname === "::1") return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true;
  return !hostname.includes(".");
}

/**
 * Public storefront pages are indexable.
 * Backup instances and any other public hostname stay noindex.
 * A leftover SEARCH_INDEXING=false or SITE_ROLE=preview does not hide
 * hustlerdior.com, including when the edge forwards an internal Host and
 * SITE_URL is already the canonical origin.
 */
export function isIndexable(
  env: Record<string, string | undefined> = process.env,
  host?: string,
) {
  if (env.SITE_ROLE === "backup") return false;
  const hostname = host ? normalizeHost(host) : "";
  if (hostname && isProductionHost(hostname)) return true;
  if (hostname && !isInternalHost(hostname)) return false;
  return siteOrigin(env) === CANONICAL_ORIGIN;
}

/**
 * Non-public routes stay out of the index even on the production host.
 * Curated is a catalog preview: noindex, but its links may be followed.
 * Checkout and order status are private. API routes are not documents.
 */
export function unindexedRobotsDirective(pathname: string) {
  if (/^\/(api|checkout|orders)(\/|$)/.test(pathname)) {
    return "noindex, nofollow";
  }
  if (/^\/curated(\/|$)/.test(pathname)) return "noindex, follow";
  return null;
}

export function xRobotsTag(
  env: Record<string, string | undefined>,
  host: string,
  pathname: string,
) {
  if (!isIndexable(env, host)) return "noindex, nofollow, noarchive";
  return unindexedRobotsDirective(pathname);
}

export function robotsMetadata(indexable: boolean) {
  return indexable
    ? { index: true as const, follow: true as const }
    : { index: false as const, follow: false as const };
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
