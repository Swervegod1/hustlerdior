import type Stripe from "stripe";
import type { Product, ProductVariant } from "./types";

export interface CatalogScope {
  accountId: string;
  livemode: boolean;
  storeId: string;
}
export interface CatalogMapping {
  productId: number;
  variantId: number;
  catalogVariantId: number;
  stripeProductId: string;
  priceId: string;
  unitAmount: number;
  currency: string;
  size: string;
  color: string;
}
export interface ImportedCatalog extends CatalogScope {
  sourceUrl: string;
  fetchedAt: string;
  importedAt?: string;
  complete: boolean;
  entries: CatalogMapping[];
}
export interface CatalogManifest {
  version: number;
  catalogs: ImportedCatalog[];
}

export function productMatches(
  product: Stripe.Product,
  id: number,
  scope: CatalogScope,
) {
  return (
    product.active &&
    product.livemode === scope.livemode &&
    product.metadata.printful_store_id === scope.storeId &&
    product.metadata.printful_sync_product_id === String(id) &&
    product.metadata.storefront === "https://hustlerdior.com"
  );
}

export function priceMatches(
  price: Stripe.Price,
  product: Stripe.Product,
  variant: ProductVariant,
  scope: CatalogScope,
) {
  const parent =
    typeof price.product === "string" ? price.product : price.product.id;
  return (
    price.active &&
    price.livemode === scope.livemode &&
    parent === product.id &&
    price.type === "one_time" &&
    price.billing_scheme === "per_unit" &&
    !price.recurring &&
    !price.transform_quantity &&
    !price.custom_unit_amount &&
    price.currency === variant.currency.toLowerCase() &&
    price.unit_amount === variant.priceCents &&
    price.tax_behavior === "exclusive" &&
    price.metadata.printful_sync_product_id ===
      product.metadata.printful_sync_product_id &&
    price.metadata.printful_sync_variant_id === String(variant.id) &&
    price.metadata.printful_catalog_variant_id ===
      String(variant.catalogVariantId)
  );
}

export function priceLookupKey(storeId: string, variant: ProductVariant) {
  return `hd_pf_${storeId}_${variant.id}_${variant.currency.toLowerCase()}_${variant.priceCents}_exclusive`;
}

export function productCreateParams(
  product: Product,
  scope: CatalogScope,
): Stripe.ProductCreateParams {
  return {
    id: `hd_pf_${product.id}`,
    name: product.name,
    description: product.name,
    images: [
      ...new Set(
        [product.image, ...product.variants.map((v) => v.image)].filter(
          (v): v is string => !!v,
        ),
      ),
    ].slice(0, 8),
    shippable: true,
    url: `https://hustlerdior.com/products/${product.slug}`,
    metadata: {
      source: "printful",
      storefront: "https://hustlerdior.com",
      printful_store_id: scope.storeId,
      printful_sync_product_id: String(product.id),
      slug: product.slug,
      category: product.category,
      audience: product.audience,
    },
  };
}

export function priceCreateParams(
  product: Product,
  variant: ProductVariant,
  stripeProductId: string,
  scope: CatalogScope,
): Stripe.PriceCreateParams {
  if (
    variant.stock !== "available" ||
    variant.currency !== "USD" ||
    !Number.isSafeInteger(variant.priceCents) ||
    variant.priceCents <= 0
  )
    throw new Error("Variant is not eligible for this USD storefront");
  return {
    product: stripeProductId,
    currency: variant.currency.toLowerCase(),
    unit_amount: variant.priceCents,
    tax_behavior: "exclusive",
    lookup_key: priceLookupKey(scope.storeId, variant),
    nickname: `${variant.color} / ${variant.size}`.slice(0, 250),
    metadata: {
      printful_store_id: scope.storeId,
      printful_sync_product_id: String(product.id),
      printful_sync_variant_id: String(variant.id),
      printful_catalog_variant_id: String(variant.catalogVariantId),
      size: variant.size,
      color: variant.color,
      stock_at_import: variant.stock,
    },
  };
}

export function catalogMapping(
  product: Product,
  variant: ProductVariant,
  stripeProduct: Stripe.Product,
  price: Stripe.Price,
): CatalogMapping {
  return {
    productId: product.id,
    variantId: variant.id,
    catalogVariantId: variant.catalogVariantId,
    stripeProductId: stripeProduct.id,
    priceId: price.id,
    unitAmount: variant.priceCents,
    currency: variant.currency.toLowerCase(),
    size: variant.size,
    color: variant.color,
  };
}

/** Stable IDs and exact values only; never match by a display name or silently pick an ambiguous parent. */
export function planCatalog(
  products: Product[],
  existingProducts: Stripe.Product[],
  existingPrices: Stripe.Price[],
  scope: CatalogScope,
) {
  const mappings: CatalogMapping[] = [],
    skipped: { productId: number; variantId: number; reason: string }[] = [];
  const missingProducts: {
    product: Product;
    params: Stripe.ProductCreateParams;
  }[] = [];
  const missingPrices: {
    product: Product;
    variant: ProductVariant;
    params: Stripe.PriceCreateParams;
  }[] = [];
  const seenProducts = new Set<number>(),
    seenVariants = new Set<number>();
  for (const product of products) {
    if (seenProducts.has(product.id))
      throw new Error("Duplicate source product ID");
    seenProducts.add(product.id);
    const parents = existingProducts.filter((p) =>
      productMatches(p, product.id, scope),
    );
    if (parents.length > 1)
      throw new Error(`Ambiguous Stripe product mapping: ${product.id}`);
    const parent = parents[0];
    const params = productCreateParams(product, scope);
    if (!parent && existingProducts.some((p) => p.id === params.id))
      throw new Error(`Conflicting or archived product: ${product.id}`);
    if (
      !parent &&
      product.variants.some(
        (v) => v.stock === "available" && v.currency === "USD",
      )
    )
      missingProducts.push({ product, params });
    for (const variant of product.variants) {
      if (seenVariants.has(variant.id))
        throw new Error("Duplicate source variant ID");
      seenVariants.add(variant.id);
      if (variant.stock !== "available" || variant.currency !== "USD") {
        skipped.push({
          productId: product.id,
          variantId: variant.id,
          reason:
            variant.stock !== "available"
              ? variant.stock
              : "unsupported_currency",
        });
        continue;
      }
      const matches = parent
        ? existingPrices.filter((p) => priceMatches(p, parent, variant, scope))
        : [];
      // Preserve duplicates/history if already present; choose a reproducible existing exact match.
      matches.sort((a, b) => a.created - b.created || a.id.localeCompare(b.id));
      if (parent && matches[0])
        mappings.push(catalogMapping(product, variant, parent, matches[0]));
      else
        missingPrices.push({
          product,
          variant,
          params: priceCreateParams(
            product,
            variant,
            parent?.id ?? params.id!,
            scope,
          ),
        });
    }
  }
  return { mappings, skipped, missingProducts, missingPrices };
}

export function assertMappedPrice(
  price: Stripe.Price,
  mapping: CatalogMapping,
  scope: CatalogScope,
) {
  const product = price.product;
  if (
    typeof product === "string" ||
    product.deleted ||
    !productMatches(product, mapping.productId, scope) ||
    product.id !== mapping.stripeProductId ||
    price.id !== mapping.priceId ||
    !priceMatches(
      price,
      product,
      {
        id: mapping.variantId,
        catalogVariantId: mapping.catalogVariantId,
        name: product.name,
        size: mapping.size,
        color: mapping.color,
        image: null,
        stock: "available",
        currency: mapping.currency.toUpperCase(),
        priceCents: mapping.unitAmount,
      },
      scope,
    )
  )
    throw new Error(
      "Imported Stripe price no longer matches the verified catalog",
    );
}
