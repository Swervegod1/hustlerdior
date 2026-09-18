import { z } from "zod";

const imageUrl = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    url.hostname === "cdn.shopify.com" &&
    !url.username &&
    !url.password &&
    !url.port
  );
}, "Only Shopify-hosted catalog images are accepted");
const pageInfo = z.object({
  hasNextPage: z.literal(false),
  endCursor: z.string().nullable(),
});
const variant = z.object({
  id: z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/),
  title: z.string(),
  sku: z.string().nullable(),
  price: z.string().regex(/^\d+\.\d{2}$/),
  inventoryQuantity: z.number().int().nullable(),
  inventoryPolicy: z.enum(["DENY", "CONTINUE"]),
  availableForSale: z.boolean(),
  selectedOptions: z.array(z.object({ name: z.string(), value: z.string() })),
  inventoryItem: z.object({ tracked: z.boolean() }),
});
export const shopifyImportSchema = z.object({
  source: z.literal("shopify"),
  shopDomain: z.literal("9t6qcq-0d.myshopify.com"),
  currency: z.literal("USD"),
  fetchedAt: z.iso.datetime(),
  complete: z.literal(true),
  products: z
    .array(
      z.object({
        id: z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/),
        title: z.string().min(1),
        handle: z.string(),
        status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED", "UNLISTED"]),
        vendor: z.string(),
        productType: z.string(),
        description: z.string(),
        descriptionHtml: z.string(),
        tags: z.array(z.string()),
        updatedAt: z.iso.datetime(),
        createdAt: z.iso.datetime().optional(),
        onlineStoreUrl: z.string().nullable(),
        variantsCount: z.object({ count: z.number().int() }),
        media: z.object({
          pageInfo,
          nodes: z.array(
            z.object({
              preview: z
                .object({
                  image: z
                    .object({ url: imageUrl, altText: z.string().nullable() })
                    .nullable(),
                })
                .nullable(),
            }),
          ),
        }),
        variants: z.object({ pageInfo, nodes: z.array(variant).min(1) }),
      }),
    )
    .superRefine((products, context) => {
      const ids = new Set<string>();
      const variants = new Set<string>();
      products.forEach((p, index) => {
        if (ids.has(p.id))
          context.addIssue({
            code: "custom",
            path: [index, "id"],
            message: "Duplicate Shopify product",
          });
        ids.add(p.id);
        if (p.variants.nodes.length !== p.variantsCount.count)
          context.addIssue({
            code: "custom",
            path: [index, "variants"],
            message: "Incomplete variant export",
          });
        p.variants.nodes.forEach((v) => {
          if (variants.has(v.id))
            context.addIssue({
              code: "custom",
              path: [index, "variants"],
              message: "Duplicate variant",
            });
          variants.add(v.id);
        });
      });
    }),
});

export function normalizeShopifyImport(value: unknown) {
  const source = shopifyImportSchema.parse(value);
  return {
    source: source.source,
    fetchedAt: source.fetchedAt,
    currency: source.currency,
    // This import is a catalog snapshot. Provider checkout must be connected
    // separately; a Shopify variant must never reach Printful's order API.
    checkoutEnabled: false as const,
    products: source.products
      .filter((p) => p.status === "ACTIVE")
      .map((p) => ({
        id: p.id,
        slug: p.handle,
        name: p.title,
        createdAt: p.createdAt ?? null,
        vendor: p.vendor,
        description: p.description,
        category: category(p.title, p.productType),
        audience: shopifyAudience(
          [p.title, p.productType, ...p.tags].join(" "),
        ),
        images: [
          ...new Map(
            p.media.nodes.flatMap((m) =>
              m.preview?.image
                ? [[m.preview.image.url, m.preview.image] as const]
                : [],
            ),
          ).values(),
        ],
        currency: source.currency,
        variants: p.variants.nodes.map((v) => ({
          id: v.id,
          title: v.title,
          sku: v.sku,
          priceCents: decimalCents(v.price),
          availableAtImport: v.availableForSale,
          options: v.selectedOptions,
        })),
      })),
  };
}
export function shopifyAudience(text: string) {
  if (/\b(kids?|children|child|youth|toddler|baby|boys?|girls?)\b/i.test(text))
    return "Kids";
  const women = /\b(women(?:['’]?s)?|female|ladies)\b/i.test(text);
  const men = /\b(men(?:['’]?s)?|male)\b/i.test(text);
  if (/\bunisex\b/i.test(text) || (women && men)) return "Unisex";
  if (women) return "Women";
  if (men) return "Men";
  return "Not specified";
}
function decimalCents(price: string) {
  const [whole, fraction] = price.split(".");
  const value = Number(whole) * 100 + Number(fraction);
  if (!Number.isSafeInteger(value)) throw new Error("Price exceeds safe range");
  return value;
}
function category(name: string, type: string) {
  const text = `${name} ${type}`;
  if (/\b(perfumes?|colognes?|parfum|fragrance)\b/i.test(text))
    return "Fragrance";
  if (/\b(bikini|swimsuit|swimwear)\b/i.test(text)) return "Swimwear";
  if (
    /\b(hats?|caps?|beanies?|bags?|glasses|sunglasses|backpacks?|belts?|gloves?)\b/i.test(
      text,
    )
  )
    return "Accessories";
  if (/\b(hoodies?|sweaters?|sweatshirts?|jackets?|coats?)\b/i.test(text))
    return "Layers";
  if (
    /\b(pants?|sweatpants|shorts|jeans|trousers|skirts?|denims)\b/i.test(text)
  )
    return "Bottoms";
  if (/\b(dress|dresses|jumpsuits?)\b/i.test(text)) return "Dresses & sets";
  if (/\b(tees?|t-shirts?|shirts?|tops?|polos?|camisoles?)\b/i.test(text))
    return "Tees & tops";
  if (
    /\b(boots?|sneakers?|shoes?|sandals?|footwear|mules?|slides?|jordan|yeezy)\b/i.test(
      text,
    )
  )
    return "Footwear";
  return "Other";
}
export type ShopifyEdit = ReturnType<typeof normalizeShopifyImport>;
export type ShopifyPiece = ShopifyEdit["products"][number];
