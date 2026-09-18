import { readFile, writeFile } from "node:fs/promises";
import { normalizeShopifyImport } from "../src/lib/shopify-import.ts";
const imported = JSON.parse(
  await readFile(
    new URL("../inventory/shopify-import.json", import.meta.url),
    "utf8",
  ),
);
const catalog = normalizeShopifyImport(imported);
await writeFile(
  new URL("../src/data/shopify-catalog.json", import.meta.url),
  JSON.stringify(catalog, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    products: catalog.products.length,
    variants: catalog.products.reduce((n, p) => n + p.variants.length, 0),
    checkoutEnabled: catalog.checkoutEnabled,
  }),
);
