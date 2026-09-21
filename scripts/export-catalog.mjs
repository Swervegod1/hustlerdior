import { mkdir, writeFile } from "node:fs/promises";
import { normalizeProduct } from "../src/lib/normalize.ts";

const token = process.env.PRINTFUL_API_TOKEN || process.env.PRINTFUL_API_KEY,
  store = process.env.PRINTFUL_STORE_ID;
if (!token || !store)
  throw new Error(
    "Set PRINTFUL_API_TOKEN (or PRINTFUL_API_KEY) and PRINTFUL_STORE_ID in .env.local.",
  );
async function get(path) {
  const response = await fetch(`https://api.printful.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, "X-PF-Store-Id": store },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(
      `Printful request failed (${response.status}); no snapshot overwritten.`,
    );
  return response.json();
}
const products = [],
  catalogIds = new Set();
let offset = 0,
  more = true;
while (more) {
  const page = await get(
    `/store/products?limit=100&offset=${offset}&status=synced`,
  );
  for (const product of page.result) {
    const detail = await get(`/store/products/${product.id}`);
    const normalized = normalizeProduct(detail.result);
    if (normalized) products.push(normalized);
    for (const v of detail.result.sync_variants)
      if (v.product?.product_id) catalogIds.add(v.product.product_id);
    // Space requests below the default 120/min budget; no retry of upstream mutations.
    await new Promise((resolve) => setTimeout(resolve, 550));
  }
  offset += page.result.length;
  more = page.result.length > 0 && offset < page.paging.total;
}
await mkdir("src/data", { recursive: true });
await writeFile(
  "src/data/catalog-snapshot.json",
  JSON.stringify({
    fetchedAt: new Date().toISOString(),
    source: "printful",
    storeId: Number(store),
    products,
  }),
);
await writeFile(
  "src/data/printful-catalog-ids.json",
  JSON.stringify([...catalogIds].sort((a, b) => a - b)),
);
console.log(
  `Exported ${products.length} products and ${products.reduce((n, p) => n + p.variants.length, 0)} variants. No API keys or artwork files exported.`,
);
