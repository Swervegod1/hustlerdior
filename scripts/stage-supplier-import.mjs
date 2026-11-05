import { mkdir, readFile, writeFile, rename, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

const hosts = new Set([
  "rarefoot.com",
  "alcosport.com",
  "www.waybiker.com",
  "global.musinsa.com",
  "7thearthstudios.com",
  "www.aelfriceden.com",
  "us.cernucci.com",
  "techwearofficial.com",
  "jadedldn.com",
  "dtfjersey.com",
  "www.everfulwholesale.com",
  "www.wordans.com",
  "www.blankstyle.com",
  "www.onehanesplace.com",
  "spanx.com",
  "www.apliiq.com",
  "www.etsy.com",
]);

export function validateImport(input) {
  if (
    input?.schemaVersion !== 1 ||
    input.livePublished !== 0 ||
    !Array.isArray(input.products) ||
    !input.products.length
  )
    throw new Error("Expected a non-published supplier draft manifest");
  const products = new Set();
  for (const product of input.products) {
    const url = new URL(product.sourceUrl);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !hosts.has(url.hostname)
    )
      throw new Error("Unexpected supplier URL");
    if (
      typeof product.id !== "string" ||
      !product.id ||
      products.has(product.id)
    )
      throw new Error("Duplicate or missing product ID");
    products.add(product.id);
    if (
      product.status !== "draft" ||
      product.saleEnabled !== false ||
      product.fulfillmentConfigured !== false ||
      !Array.isArray(product.variants)
    )
      throw new Error("Import cannot enable sales or fulfillment");
    const variants = new Set();
    for (const variant of product.variants) {
      if (
        variant.saleEnabled !== false ||
        variant.retailPriceCents !== null ||
        variant.currency !== "USD"
      )
        throw new Error(
          "Supplier prices are observations, not approved retail prices",
        );
      if (
        variant.sourcePriceCents !== null &&
        (!Number.isSafeInteger(variant.sourcePriceCents) ||
          variant.sourcePriceCents < 0)
      )
        throw new Error("Invalid source amount");
      if (![true, false, null].includes(variant.sourceInStock))
        throw new Error("Unknown stock must be null");
      const key =
        variant.sourceVariantId ||
        JSON.stringify([variant.sourceSku, variant.size, variant.color]);
      if (variants.has(key)) throw new Error("Duplicate source variant");
      variants.add(key);
    }
  }
  return input;
}

/** Source observations stay separate from merchant decisions and the live Printful catalog. */
export function mergeDrafts(existing, manifest) {
  validateImport(manifest);
  const products = new Map((existing?.products || []).map((p) => [p.id, p]));
  let added = 0;
  let matched = 0;
  for (const source of manifest.products) {
    const prior = products.get(source.id);
    if (prior) matched++;
    else added++;
    products.set(source.id, {
      id: source.id,
      observation: source,
      merchant: prior?.merchant || {
        status: "draft",
        saleEnabled: false,
        retailPrices: {},
        fulfillment: "not-configured",
      },
    });
  }
  return {
    queue: { schemaVersion: 1, products: [...products.values()] },
    added,
    matched,
  };
}

export async function stage(
  source,
  destination = "private-data/supplier-import-drafts.json",
) {
  const manifest = validateImport(JSON.parse(await readFile(source, "utf8")));
  const target = resolve(destination);
  await mkdir(dirname(target), { recursive: true, mode: 0o700 });
  const lock = target + ".lock";
  await mkdir(lock); // Fail on concurrent writers; never remove another writer's lock.
  const temporary = target + "." + randomUUID() + ".tmp";
  try {
    let existing;
    try {
      existing = JSON.parse(await readFile(target, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const { queue, added, matched } = mergeDrafts(existing, manifest);
    await writeFile(temporary, JSON.stringify(queue, null, 2) + "\n", {
      mode: 0o600,
    });
    await rename(temporary, target);
    return {
      added,
      matched,
      total: queue.products.length,
      published: 0,
      file: target,
    };
  } finally {
    await rm(temporary, { force: true });
    await rm(lock, { recursive: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (!process.argv[2])
    throw new Error(
      "Usage: node scripts/stage-supplier-import.mjs <manifest.json> [private queue path]",
    );
  stage(process.argv[2], process.argv[3])
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
