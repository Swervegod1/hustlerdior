// Read-only account-specific product quotes. This script cannot place orders or publish inventory.
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { stageWholesaleCandidates } from "../src/lib/supplier-candidates.ts";

const account = process.env.SS_ACTIVEWEAR_ACCOUNT_NUMBER;
const key = process.env.SS_ACTIVEWEAR_API_KEY;
if (!account || !key)
  throw new Error(
    "Configure SS_ACTIVEWEAR_ACCOUNT_NUMBER and SS_ACTIVEWEAR_API_KEY on the server first.",
  );
const candidates = stageWholesaleCandidates(
  JSON.parse(await readFile("inventory/wholesale-candidates.json", "utf8")),
);
const styleIds = [...new Set(candidates.map((p) => p.supplierStyleId))];
const url = new URL("https://api.ssactivewear.com/v2/products/");
url.searchParams.set("styleid", styleIds.join(","));
url.searchParams.set(
  "fields",
  "sku,styleID,brandName,styleName,colorName,sizeName,qty,customerPrice,mapPrice,noeRetailing,warehouses,mediaAssets",
);
const response = await fetch(url, {
  headers: {
    Authorization: `Basic ${Buffer.from(`${account}:${key}`).toString("base64")}`,
    Accept: "application/json",
  },
  redirect: "error",
  signal: AbortSignal.timeout(30000),
});
if (!response.ok)
  throw new Error(
    `S&S request failed (${response.status}). No inventory was changed.`,
  );
if (!response.headers.get("content-type")?.includes("application/json"))
  throw new Error("Unexpected S&S response type.");
const quoteSchema = z
  .array(
    z
      .object({
        sku: z.string().min(1),
        styleID: z.number().int().positive(),
        brandName: z.string(),
        styleName: z.string(),
        colorName: z.string(),
        sizeName: z.string(),
        qty: z.number().int().nonnegative(),
        customerPrice: z.number().finite().nonnegative(),
        mapPrice: z.number().finite().nonnegative().optional(),
        noeRetailing: z.boolean().optional(),
      })
      .passthrough(),
  )
  .max(10000);
const quotes = quoteSchema.parse(await response.json());
if (quotes.some((p) => !styleIds.includes(p.styleID)))
  throw new Error("Supplier returned a style outside the selected capsule.");
const seen = new Set();
for (const p of quotes) {
  if (seen.has(p.sku))
    throw new Error("Supplier returned duplicate SKUs; review the feed.");
  seen.add(p.sku);
}
await mkdir("private-data", { recursive: true, mode: 0o700 });
const target = "private-data/ss-activewear-quoted-products.json";
const temporary = `${target}.${randomUUID()}.tmp`;
await writeFile(
  temporary,
  JSON.stringify(
    {
      supplier: "ss-activewear",
      fetchedAt: new Date().toISOString(),
      currency: "USD",
      status: "quote-review",
      saleEnabled: false,
      note: "Supplier quotes are not a fulfillment or image-use approval. Shipping, restrictions and retail pricing still need review.",
      products: quotes,
    },
    null,
    2,
  ),
  { mode: 0o600 },
);
await rename(temporary, target);
console.log(
  JSON.stringify({
    supplierVariants: quotes.length,
    quotedStyles: new Set(quotes.map((p) => p.styleID)).size,
    file: target,
    published: 0,
  }),
);
