import { z } from "zod";

// Wholesale fulfillment is separate from Printful: never turn a sneaker SKU into a Printful variant ID.
export const wholesaleFeedSchema = z.array(
  z
    .object({
      supplier: z.enum([
        "ss-activewear",
        "faire",
        "brandsgateway",
        "cj-dropshipping",
        "trendsi",
        "zendrop",
        "authorized-sneaker-distributor",
      ]),
      supplierSku: z.string().min(1).max(100),
      name: z.string().min(2).max(250),
      brand: z.string().min(1).max(100),
      audience: z.enum(["Women", "Men", "Unisex", "Kids"]),
      category: z.enum([
        "Tees",
        "Layers",
        "Bottoms",
        "Accessories",
        "Footwear",
      ]),
      size: z.string().min(1).max(30),
      color: z.string().min(1).max(100),
      quantityAvailable: z.number().int().min(0),
      costCents: z.number().int().positive(),
      shippingCostCents: z.number().int().nonnegative(),
      currency: z.literal("USD"),
      imageUrl: z
        .url()
        .refine(
          (value) => new URL(value).protocol === "https:",
          "Use HTTPS images.",
        ),
      supplierProductUrl: z
        .url()
        .refine(
          (value) => new URL(value).protocol === "https:",
          "Use HTTPS source links.",
        ),
      feedUpdatedAt: z.iso.datetime(),
      authenticityEvidence: z.string().min(1),
      imageUsageAuthorized: z.boolean(),
      resaleAuthorized: z.boolean(),
    })
    .strict(),
);

export function stageWholesaleFeed(input: unknown, now = new Date()) {
  return wholesaleFeedSchema.parse(input).map((p) => ({
    ...p,
    status: "draft" as const,
    reviewIssues: [
      ...(!p.resaleAuthorized
        ? ["Verify resale rights and supplier account."]
        : []),
      ...(!p.imageUsageAuthorized
        ? ["Obtain permission to use the product images."]
        : []),
      ...(p.quantityAvailable === 0
        ? ["Supplier has no available stock."]
        : []),
      ...(now.getTime() - Date.parse(p.feedUpdatedAt) > 24 * 60 * 60 * 1000 ||
      Date.parse(p.feedUpdatedAt) > now.getTime() + 60000
        ? ["Obtain a current stock feed."]
        : []),
    ],
  }));
}

/** Illustrative price floor; validate actual payment fees, duties, returns and tax treatment for each supplier. */
export function priceForMargin(
  costCents: number,
  shippingCents: number,
  margin = 0.4,
  paymentFeeRate = 0.029,
  paymentFeeCents = 30,
) {
  const values = [costCents, shippingCents, paymentFeeCents];
  if (
    values.some((n) => !Number.isSafeInteger(n) || n < 0) ||
    !Number.isFinite(margin) ||
    !Number.isFinite(paymentFeeRate) ||
    margin < 0 ||
    paymentFeeRate < 0 ||
    margin + paymentFeeRate >= 1
  )
    throw new Error("Invalid margin inputs");
  return Math.ceil(
    (costCents + shippingCents + paymentFeeCents) /
      (1 - margin - paymentFeeRate),
  );
}
