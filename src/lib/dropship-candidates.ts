import { z } from "zod";

const httpsUrl = z.url().refine((value) => {
  const u = new URL(value);
  return u.protocol === "https:" && !u.username && !u.password;
}, "Use a public HTTPS source URL.");
const cents = z.number().int().min(0).max(100_000_000);
const imageSchema = z
  .object({
    sourceUrl: httpsUrl,
    localFile: z
      .string()
      .regex(/^inventory\/dropship-images\/[a-z0-9-]+\.(webp|jpg)$/)
      .nullable(),
    sha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    status: z.enum(["downloaded", "unavailable"]),
    usagePermission: z.literal("pending"),
    variantMapping: z.literal("unverified"),
  })
  .strict()
  .superRefine((image, ctx) => {
    if (
      (image.status === "downloaded") !==
      Boolean(image.localFile && image.sha256)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Downloaded images need a local file and checksum.",
      });
    }
  });

// A public listing is evidence for a buying draft, not a live stock or cost feed.
export const dropshipCandidateSchema = z
  .object({
    candidateId: z.string().regex(/^(trendsi|cj-dropshipping):\d+$/),
    supplier: z.enum(["trendsi", "cj-dropshipping"]),
    supplierProductId: z.string().regex(/^\d+$/),
    observedSkuId: z.string().min(1).nullable(),
    observedStyleNumber: z.string().min(1).nullable(),
    name: z.string().min(2).max(250),
    brand: z.string().max(100).nullable(),
    audience: z.enum(["Women", "Men", "Kids", "Unisex"]),
    category: z.enum([
      "Shirts",
      "Hoodies",
      "Polos",
      "Hats",
      "Shoes",
      "Tank tops",
      "Jackets",
      "Boots",
      "Bags",
      "Glasses",
      "Sweaters",
      "Sweatshirts",
    ]),
    collection: z.enum(["Concrete", "After Hours", "Playground"]),
    priority: z.enum(["sample-first", "add-on-test", "hold"]),
    description: z.string().min(30).max(800),
    material: z.string().max(250).nullable(),
    fabricWeightGsm: z.null(),
    observedSizes: z.array(z.string().min(1)).max(30),
    observedColors: z.array(z.string().min(1)).max(30),
    optionScope: z.literal(
      "Public page observations; not a complete variant feed or photo-to-variant match.",
    ),
    source: z
      .object({
        url: httpsUrl,
        catalogUrl: httpsUrl.nullable(),
        evidence: z.enum(["product-page", "catalog-listing"]),
        checkedAt: z.iso.datetime(),
        freshness: z.literal(
          "Public page or search snapshot; refresh before buying.",
        ),
      })
      .strict(),
    priceObservation: z
      .object({
        publicDropshipCents: cents.positive(),
        bulkWholesaleCents: cents.positive().nullable(),
        supplierMsrpCents: cents.positive().nullable(),
        currency: z.literal("USD"),
        selectedDestination: z.enum(["United States", "Germany"]).nullable(),
        displayedShippingCents: cents.nullable(),
        displayedDelivery: z.string().max(300).nullable(),
        accountQuoteVerified: z.literal(false),
      })
      .strict(),
    images: z.array(imageSchema).max(10),
    notes: z.array(z.string().min(1).max(500)).max(15),
    supplierVariantSku: z.null(),
    accountCostCents: z.null(),
    shippingCostCents: z.null(),
    retailPriceCents: z.null(),
    quantityAvailable: z.null(),
    stockCheckedAt: z.null(),
    resalePermission: z.literal("pending"),
    fulfillmentStatus: z.literal("not-configured"),
    status: z.literal("research-draft"),
    saleEnabled: z.literal(false),
  })
  .strict()
  .superRefine((row, ctx) => {
    const u = new URL(row.source.url);
    const valid =
      row.supplier === "trendsi"
        ? u.hostname === "www.trendsi.com" &&
          u.pathname === "/products/detail" &&
          u.searchParams.get("id") === row.supplierProductId
        : u.hostname === "cjdropshipping.com" &&
          u.pathname.startsWith("/product/") &&
          u.pathname.endsWith(`-p-${row.supplierProductId}.html`);
    if (
      !valid ||
      row.candidateId !== `${row.supplier}:${row.supplierProductId}`
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["source"],
        message: "Supplier, product ID and canonical source must match.",
      });
    }
    if (row.source.evidence === "catalog-listing" && !row.source.catalogUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["source", "catalogUrl"],
        message: "Catalog-only evidence needs its category source.",
      });
    }
    const allowedImages =
      row.supplier === "trendsi"
        ? ["statics.trendsi.com"]
        : ["cf.cjdropshipping.com", "cc-west-usa.oss-accelerate.aliyuncs.com"];
    for (const image of row.images) {
      if (!allowedImages.includes(new URL(image.sourceUrl).hostname)) {
        ctx.addIssue({
          code: "custom",
          path: ["images"],
          message: "Image must use an observed supplier image host.",
        });
      }
    }
  });

export type DropshipCandidate = z.infer<typeof dropshipCandidateSchema>;

export function stageDropshipCandidates(input: unknown) {
  const rows = z.array(dropshipCandidateSchema).min(1).max(500).parse(input);
  if (new Set(rows.map((r) => r.candidateId)).size !== rows.length) {
    throw new Error("Duplicate dropshipping candidate ID.");
  }
  return rows.map((row) => ({
    ...row,
    reviewIssues: [
      "Connect the supplier account and map exact variant SKUs, live costs and stock.",
      "Confirm resale and product-artwork rights, including rights to use supplier photos.",
      "Obtain a destination-specific shipping and duty quote; approve the retail price.",
      "Configure supplier-specific fulfillment, tracking, cancellations and returns.",
      ...(row.images.some((i) => i.status === "downloaded")
        ? []
        : ["Obtain the product's actual image files."]),
      ...(row.source.evidence === "catalog-listing"
        ? [
            "Open the full product record and verify materials, sizes and photos.",
          ]
        : []),
      ...(row.audience === "Kids"
        ? [
            "Verify children's size measurements and applicable supplier product documentation.",
          ]
        : []),
      "Sample the item before launch; confirm artwork, color, fit and construction.",
    ],
  }));
}

const scenarioSchema = z
  .object({
    costCents: cents,
    shippingCents: cents,
    dutyAllowanceCents: cents,
    fixedFeeCents: cents,
    feeRate: z.number().min(0).lt(1),
    returnLossReserveRate: z.number().min(0).lt(1),
    targetContributionRate: z.number().min(0).lt(1),
  })
  .strict()
  .refine(
    (v) => v.feeRate + v.returnLossReserveRate + v.targetContributionRate < 1,
    "Fees, reserve and contribution target must sum to less than 100%.",
  );

// Merchandise revenue, no sales tax. Reserve is expected loss/revenue, not return rate.
// This is a planning scenario before advertising and overhead, not an approved retail price.
export function contributionScenario(input: z.input<typeof scenarioSchema>) {
  const v = scenarioSchema.parse(input);
  const fixedCosts =
    v.costCents + v.shippingCents + v.dutyAllowanceCents + v.fixedFeeCents;
  const floorCents = Math.ceil(
    fixedCosts /
      (1 - v.feeRate - v.returnLossReserveRate - v.targetContributionRate),
  );
  const testPriceCents = Math.max(
    99,
    Math.ceil((floorCents - 99) / 100) * 100 + 99,
  );
  const contributionCents = Math.floor(
    testPriceCents * (1 - v.feeRate - v.returnLossReserveRate) - fixedCosts,
  );
  return {
    ...v,
    floorCents,
    testPriceCents,
    contributionCents,
    maxAcquisitionCostAt20PercentCents: Math.max(
      0,
      Math.floor(contributionCents - testPriceCents * 0.2),
    ),
    scope:
      "Illustrative contribution before advertising and overhead; sales tax excluded." as const,
  };
}
