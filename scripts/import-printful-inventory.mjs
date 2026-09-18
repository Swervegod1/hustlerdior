import { mkdir, writeFile } from "node:fs/promises";
import { normalizeProduct } from "../src/lib/normalize.ts";

const token = process.env.PRINTFUL_API_TOKEN;
if (!token) throw new Error("PRINTFUL_API_TOKEN is required.");
async function read(path, storeId) {
  const response = await fetch(`https://api.printful.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(storeId ? { "X-PF-Store-Id": String(storeId) } : {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok)
    throw new Error(
      `Printful inventory read failed (${response.status}). Existing exports retained.`,
    );
  return response.json();
}
const stores = [];
let offset = 0;
while (true) {
  const page = await read(`/stores?limit=100&offset=${offset}`);
  if (!Array.isArray(page.result)) throw new Error("Invalid store list.");
  stores.push(...page.result);
  offset += page.result.length;
  if (offset >= page.paging.total) break;
  if (!page.result.length) throw new Error("Incomplete store pagination.");
}
const imported = [],
  allProducts = [],
  catalogIds = new Set();
for (const store of stores) {
  // Store API is for native stores; ecommerce integrations use the Sync API.
  const resource =
    store.type === "native" ? "/store/products" : "/sync/products";
  const records = [],
    products = [];
  offset = 0;
  while (true) {
    const page = await read(`${resource}?limit=100&offset=${offset}`, store.id);
    if (!Array.isArray(page.result)) throw new Error("Invalid product list.");
    for (const entry of page.result) {
      const detail = (await read(`${resource}/${entry.id}`, store.id)).result;
      const product = normalizeProduct(detail);
      if (product) products.push({ ...product, sourceStoreId: store.id });
      records.push({
        productId: entry.id,
        name: entry.name,
        ignored: Boolean(entry.is_ignored),
        sourceStoreId: store.id,
        variants: detail.sync_variants.map((v) => ({
          id: v.id,
          sku: v.sku ?? null,
          name: v.name,
          size: v.size ?? null,
          color: v.color ?? null,
          retailPrice: v.retail_price,
          currency: v.currency,
          synced: v.synced,
          ignored: Boolean(v.is_ignored),
          availability: v.availability_status ?? "unknown",
          catalogVariantId: v.variant_id,
        })),
      });
      for (const variant of detail.sync_variants)
        if (variant.product?.product_id)
          catalogIds.add(variant.product.product_id);
      if (records.length % 20 === 0)
        console.log(
          JSON.stringify({ store: store.id, readProducts: records.length }),
        );
      await new Promise((resolve) => setTimeout(resolve, 550));
    }
    offset += page.result.length;
    if (offset >= page.paging.total) break;
    if (!page.result.length) throw new Error("Incomplete product pagination.");
  }
  imported.push({
    id: store.id,
    name: store.name,
    type: store.type,
    complete: true,
    records,
    products,
  });
  allProducts.push(...products);
}
// The active fulfillment integration remains explicitly scoped to the configured store.
const primary = imported.find(
  (store) => String(store.id) === process.env.PRINTFUL_STORE_ID,
);
if (!primary)
  throw new Error(
    "Configured fulfillment store was not accessible; existing snapshot retained.",
  );
const fetchedAt = new Date().toISOString();
await mkdir("inventory", { recursive: true });
await writeFile(
  "inventory/printful-import.json",
  JSON.stringify(
    { source: "printful", fetchedAt, complete: true, stores: imported },
    null,
    2,
  ) + "\n",
);
await writeFile(
  "src/data/catalog-snapshot.json",
  JSON.stringify({
    source: "printful",
    fetchedAt,
    storeId: primary.id,
    products: primary.products,
  }),
);
await writeFile(
  "src/data/printful-catalog-ids.json",
  JSON.stringify([...catalogIds].sort((a, b) => a - b)),
);
console.log(
  JSON.stringify({
    accessibleStores: imported.map((s) => ({
      id: s.id,
      name: s.name,
      products: s.records.length,
      displayableProducts: s.products.length,
      variants: s.records.reduce((n, p) => n + p.variants.length, 0),
    })),
    displayableProducts: allProducts.length,
  }),
);
