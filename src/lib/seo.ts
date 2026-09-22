import type { Product, ProductVariant, StockStatus } from "./types";

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

const IN_STOCK = "https://schema.org/InStock";
const OUT_OF_STOCK = "https://schema.org/OutOfStock";

/** Integer catalog cents as a schema price. Does not round or invent an amount. */
export function schemaPrice(cents: number) {
  const abs = Math.abs(cents);
  const sign = cents < 0 ? "-" : "";
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

function isPriced(variant: ProductVariant) {
  return (
    Number.isSafeInteger(variant.priceCents) &&
    variant.priceCents > 0 &&
    /^[A-Z]{3}$/.test(variant.currency)
  );
}

/**
 * InStock only when the catalog says the variant is available.
 * Known-unavailable stock is OutOfStock. Unknown stock omits availability.
 */
export function offerAvailability(stock: StockStatus) {
  if (stock === "available") return IN_STOCK;
  if (stock === "out_of_stock" || stock === "discontinued") return OUT_OF_STOCK;
  return undefined;
}

function aggregateAvailability(stocks: StockStatus[]) {
  if (stocks.some((stock) => stock === "available")) return IN_STOCK;
  if (stocks.some((stock) => stock === "unknown")) return undefined;
  if (
    stocks.length > 0 &&
    stocks.every(
      (stock) => stock === "out_of_stock" || stock === "discontinued",
    )
  )
    return OUT_OF_STOCK;
  return undefined;
}

type SchemaOffer = {
  "@type": "Offer";
  url: string;
  priceCurrency: string;
  price: string;
  availability?: string;
};

type SchemaAggregateOffer = {
  "@type": "AggregateOffer";
  url: string;
  priceCurrency: string;
  lowPrice: string;
  highPrice: string;
  offerCount: number;
  availability?: string;
};

function offerFor(variant: ProductVariant, url: string): SchemaOffer {
  const availability = offerAvailability(variant.stock);
  return {
    "@type": "Offer",
    url,
    priceCurrency: variant.currency,
    price: schemaPrice(variant.priceCents),
    ...(availability ? { availability } : {}),
  };
}

/**
 * One Offer when a single priced variant exists.
 * AggregateOffer when several priced variants share one currency.
 * Prices and availability come only from those catalog variants.
 */
export function productOffers(
  product: Product,
): SchemaOffer | SchemaAggregateOffer | undefined {
  const priced = product.variants.filter(isPriced);
  if (!priced.length) return undefined;
  const path = `/products/${product.slug}`;
  if (priced.length === 1) {
    const variant = priced[0];
    return offerFor(variant, absoluteUrl(`${path}?variant=${variant.id}`));
  }
  const currency = priced[0].currency;
  if (priced.some((variant) => variant.currency !== currency)) return undefined;
  const prices = priced.map((variant) => variant.priceCents);
  const availability = aggregateAvailability(
    priced.map((variant) => variant.stock),
  );
  return {
    "@type": "AggregateOffer",
    url: absoluteUrl(path),
    priceCurrency: currency,
    lowPrice: schemaPrice(Math.min(...prices)),
    highPrice: schemaPrice(Math.max(...prices)),
    offerCount: priced.length,
    ...(availability ? { availability } : {}),
  };
}

/** Compact Product + Offer for collection lists. Variants stay on the PDP. */
export function listingProductData(product: Product) {
  const offers = productOffers(product);
  return {
    "@type": "Product" as const,
    name: product.name,
    url: absoluteUrl(`/products/${product.slug}`),
    ...(product.image ? { image: [product.image] } : {}),
    brand: { "@type": "Brand" as const, name: "Hustler Dior" },
    ...(offers ? { offers } : {}),
  };
}

export function productData(product: Product) {
  const path = `/products/${product.slug}`;
  const offers = productOffers(product);
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
    ...(product.image ? { image: [product.image] } : {}),
    ...(offers ? { offers } : {}),
    variesBy: ["https://schema.org/size", "https://schema.org/color"],
    hasVariant: product.variants.map((variant) => {
      const url = absoluteUrl(`${path}?variant=${variant.id}`);
      const variantOffer = isPriced(variant)
        ? offerFor(variant, url)
        : undefined;
      return {
        "@type": "Product" as const,
        "@id": `${absoluteUrl(path)}#variant-${variant.id}`,
        name: variant.name,
        sku: `HD-${variant.id}`,
        size: variant.size,
        color: variant.color,
        url,
        ...(variant.image ? { image: [variant.image] } : {}),
        brand: { "@type": "Brand" as const, name: "Hustler Dior" },
        ...(variantOffer ? { offers: variantOffer } : {}),
      };
    }),
  };
}
