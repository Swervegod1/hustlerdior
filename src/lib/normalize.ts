import { z } from "zod";
import type { Category, Product, ProductVariant, StockStatus } from "./types";

const syncProduct = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  thumbnail_url: z.string().nullish(),
  is_ignored: z.boolean().optional(),
});
const syncVariant = z.object({
  id: z.number().int().positive(),
  variant_id: z.number().int().positive().nullable(),
  name: z.string(),
  synced: z.boolean(),
  is_ignored: z.boolean().optional(),
  size: z.string().nullish(),
  color: z.string().nullish(),
  retail_price: z.string().nullable(),
  currency: z.string(),
  availability_status: z.string().optional(),
  files: z
    .array(
      z.object({
        type: z.string(),
        preview_url: z.string().nullish(),
        status: z.string(),
      }),
    )
    .optional(),
});
export const syncDetailSchema = z.object({
  sync_product: syncProduct,
  sync_variants: z.array(syncVariant),
});
export const productListSchema = z.object({
  result: z.array(syncProduct),
  paging: z.object({
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  }),
});

export function moneyToCents(value: string | null): number | null {
  if (!value || !/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function safeImage(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      [
        "files.cdn.printful.com",
        "files.printful.com",
        "printful-upload.s3-accelerate.amazonaws.com",
      ].includes(url.hostname) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function stock(status?: string): StockStatus {
  if (status === "active") return "available";
  if (status === "temporary_out_of_stock") return "out_of_stock";
  if (status === "discontinued") return "discontinued";
  return "unknown";
}

export function categoryFor(name: string): Category {
  if (/hoodie|sweatshirt|jacket|sweater|fleece/i.test(name)) return "Layers";
  if (/shorts|joggers|pants|leggings|skirt/i.test(name)) return "Bottoms";
  if (
    /cap|hat|beanie|bag|backpack|mug|bottle|towel|sticker|case|slides|shoes|sneaker/i.test(
      name,
    )
  )
    return "Accessories";
  if (/tee|shirt|tank|crew|top/i.test(name)) return "Tees";
  return "Other";
}

export function audienceFor(name: string): Product["audience"] {
  return /toddler|kids|youth|baby/i.test(name)
    ? "Kids"
    : /women|crop|fitted crew/i.test(name)
      ? "Women"
      : /unisex/i.test(name)
        ? "Unisex"
        : /men[’']?s|hoochie daddy/i.test(name)
          ? "Men"
          : "Unisex";
}

export function productSlug(name: string, id: number): string {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${id}`;
}

export function normalizeProduct(input: unknown): Product | null {
  const { sync_product: product, sync_variants } =
    syncDetailSchema.parse(input);
  if (product.is_ignored) return null;
  const variants: ProductVariant[] = sync_variants.flatMap((v) => {
    const priceCents = moneyToCents(v.retail_price);
    if (
      !v.synced ||
      v.is_ignored ||
      !v.variant_id ||
      priceCents === null ||
      !/^[A-Z]{3}$/.test(v.currency)
    )
      return [];
    return [
      {
        id: v.id,
        catalogVariantId: v.variant_id,
        name: v.name,
        size: v.size || "One size",
        color: v.color || "Original",
        priceCents,
        currency: v.currency,
        image:
          safeImage(
            v.files?.find((f) => f.type === "preview" && f.status === "ok")
              ?.preview_url,
          ) ?? safeImage(product.thumbnail_url),
        stock: stock(v.availability_status),
      },
    ];
  });
  if (!variants.length) return null;
  const currency = variants[0].currency;
  // A product cannot offer ambiguous totals in several currencies.
  if (variants.some((v) => v.currency !== currency))
    throw new Error("Mixed product currencies");
  const purchasable = variants.filter((v) => v.stock === "available");
  const prices = (purchasable.length ? purchasable : variants).map(
    (v) => v.priceCents,
  );
  return {
    id: product.id,
    name: product.name,
    slug: productSlug(product.name, product.id),
    image: safeImage(product.thumbnail_url) ?? variants[0].image,
    category: categoryFor(product.name),
    audience: audienceFor(product.name),
    variants,
    priceCents: Math.min(...prices),
    maxPriceCents: Math.max(...prices),
    currency,
  };
}
