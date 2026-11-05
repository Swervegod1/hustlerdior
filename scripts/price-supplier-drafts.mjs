import { readFile, writeFile, rename, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { validateImport } from "./stage-supplier-import.mjs";

export const RULE = "source-plus-7-percent-20261105";
export const DOMAINS = [
  "hustlerdior.com",
  "hustlerdior.shop",
  "hustlerdior.cloud",
];
export const variantKey = (v) =>
  v.sourceVariantId || JSON.stringify([v.sourceSku, v.size, v.color]);
export function markedUpCents(cents) {
  if (!Number.isSafeInteger(cents) || cents <= 0)
    throw new Error("A verified positive source amount is required");
  const amount = (BigInt(cents) * 107n + 50n) / 100n;
  if (amount > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("Amount overflow");
  return Number(amount);
}

export function priceDrafts(queue, manifest) {
  validateImport(manifest);
  const sources = new Map(manifest.products.map((p) => [p.id, p]));
  if (new Set(queue.products.map((p) => p.id)).size !== queue.products.length)
    throw new Error("Duplicate queue product");
  let products = 0,
    variants = 0,
    unpricedProducts = 0;
  const result = structuredClone(queue);
  for (const item of result.products) {
    const source = sources.get(item.id);
    if (!source) continue;
    if (item.merchant.status !== "draft" || item.merchant.saleEnabled !== false)
      throw new Error("Refusing to reprice an active product");
    const prices = {};
    for (const v of source.variants) {
      prices[variantKey(v)] = markedUpCents(v.sourcePriceCents);
      variants++;
    }
    item.observation = structuredClone(source);
    item.merchant.retailPrices = prices;
    item.merchant.pricing = {
      rule: RULE,
      markupBasisPoints: 700,
      basis: "observed_source_price",
      rounding: "nearest_cent_half_up",
      currency: "USD",
    };
    item.merchant.targetDomains = DOMAINS;
    item.merchant.publicationStatus = "held";
    products++;
    if (!source.variants.length) unpricedProducts++;
  }
  if (products !== sources.size)
    throw new Error("Stage every source product before pricing");
  return { queue: result, products, variants, unpricedProducts, published: 0 };
}

export async function priceFile(manifestPath, queuePath) {
  const target = resolve(queuePath),
    lock = target + ".lock",
    temp = target + "." + randomUUID() + ".tmp";
  await mkdir(lock);
  try {
    const original = await readFile(target, "utf8");
    const result = priceDrafts(
      JSON.parse(original),
      JSON.parse(await readFile(manifestPath, "utf8")),
    );
    await writeFile(target + ".before-7pct.json", original, {
      flag: "wx",
      mode: 0o600,
    }).catch((e) => {
      if (e.code !== "EEXIST") throw e;
    });
    await writeFile(temp, JSON.stringify(result.queue, null, 2) + "\n", {
      mode: 0o600,
    });
    await rename(temp, target);
    return {
      products: result.products,
      variants: result.variants,
      unpricedProducts: result.unpricedProducts,
      published: result.published,
    };
  } finally {
    await rm(temp, { force: true });
    await rm(lock, { recursive: true });
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (!process.argv[2] || !process.argv[3])
    throw new Error(
      "Usage: node scripts/price-supplier-drafts.mjs manifest.json private-queue.json",
    );
  priceFile(process.argv[2], process.argv[3])
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
