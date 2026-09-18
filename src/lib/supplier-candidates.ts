import { z } from "zod";

// Public product research is not a supplier stock feed. These records cannot be sold.
const sourceUrl = z.url().refine((value) => {
  const u = new URL(value);
  return (
    u.protocol === "https:" &&
    u.hostname === "www.ssactivewear.com" &&
    u.pathname.startsWith("/p/")
  );
}, "Use a canonical S&S product source.");

const imageReference = z
  .object({
    supplierPath: z.string().regex(/^(ModelColor|Color)\/\d+_[a-z]+$/),
    candidateCdnUrl: z.url().refine((value) => {
      const u = new URL(value);
      return (
        u.protocol === "https:" &&
        u.hostname === "cdn.ssactivewear.com" &&
        u.pathname.startsWith("/Images/")
      );
    }),
    color: z.string().min(1),
    downloadStatus: z.enum(["blocked-http-403", "not-fetched"]),
    localFile: z.null(),
    usagePermission: z.literal("pending"),
  })
  .strict();

export const wholesaleCandidateSchema = z
  .object({
    candidateId: z.string().regex(/^ss-activewear:[A-Z0-9]+$/),
    supplier: z.literal("ss-activewear"),
    supplierStyleId: z.number().int().positive(),
    styleCode: z.string().regex(/^[A-Z0-9]+$/),
    brand: z.string().min(1).max(100),
    name: z.string().min(2).max(250),
    audience: z.enum(["Women", "Men", "Unisex"]),
    category: z.enum(["Tees", "Layers", "Bottoms", "Accessories", "Footwear"]),
    description: z.string().min(30).max(1000),
    optionResearch: z
      .object({
        sizes: z.array(z.string().min(1)).min(1),
        colors: z.array(z.string().min(1)).min(1),
        scope: z.string().min(1),
      })
      .strict(),
    sourceUrl,
    sourceCheckedAt: z.iso.datetime(),
    imageReferences: z.array(imageReference).min(1).max(12),
    supplierVariantSku: z.null(),
    wholesaleCostCents: z.null(),
    shippingCostCents: z.null(),
    retailPriceCents: z.null(),
    currency: z.literal("USD"),
    quantityAvailable: z.null(),
    stockCheckedAt: z.null(),
    resalePermission: z.literal("pending"),
    fulfillmentStatus: z.literal("not-configured"),
    status: z.literal("research-draft"),
    saleEnabled: z.literal(false),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (p.candidateId !== `ss-activewear:${p.styleCode}`) {
      ctx.addIssue({
        code: "custom",
        message: "Candidate ID must match the supplier style.",
        path: ["candidateId"],
      });
    }
    for (const [index, image] of p.imageReferences.entries()) {
      if (
        image.candidateCdnUrl !==
        `https://cdn.ssactivewear.com/Images/${image.supplierPath}_fm.jpg`
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Image reference does not match its supplier path.",
          path: ["imageReferences", index],
        });
      }
    }
  });

export function stageWholesaleCandidates(input: unknown) {
  const rows = z.array(wholesaleCandidateSchema).max(200).parse(input);
  const ids = new Set(rows.map((row) => row.candidateId));
  if (ids.size !== rows.length)
    throw new Error("Duplicate supplier candidates.");
  return rows.map((row) => ({
    ...row,
    reviewIssues: [
      "Connect an approved supplier account and verify resale and image rights.",
      "Obtain the supplier's actual image files; CDN references have not been verified as downloadable.",
      "Fetch exact variant SKUs, current stock and account-specific wholesale costs.",
      "Quote shipping, duties and returns, then approve a contribution-based retail price.",
      "Configure supplier fulfillment separately from Printful before publication.",
    ],
  }));
}
