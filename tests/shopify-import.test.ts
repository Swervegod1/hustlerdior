import { test } from "node:test";
import assert from "node:assert/strict";
import imported from "./fixtures/shopify-import.json";
import {
  normalizeShopifyImport,
  shopifyImportSchema,
  shopifyAudience,
} from "../src/lib/shopify-import";
import { checkoutSchema } from "../src/lib/checkout-schema";

test("a complete Shopify fixture keeps all products and variants without inventing availability", () => {
  const catalog = normalizeShopifyImport(imported);
  assert.equal(catalog.products.length, 46);
  assert.equal(
    catalog.products.reduce((n, p) => n + p.variants.length, 0),
    399,
  );
  assert.equal(catalog.checkoutEnabled, false);
  assert.ok(
    catalog.products.every((p) =>
      p.variants.every((v) => !v.availableAtImport),
    ),
  );
  assert.ok(
    catalog.products.every((p) => p.id.startsWith("gid://shopify/Product/")),
  );
  assert.equal(catalog.products[0].variants[0].priceCents, 4195);
});
test("fit classification uses explicit inventory text and does not invent a unisex fit", () => {
  assert.equal(
    shopifyAudience("NIKE Air Jordan 4 Retro Womens-Size 9"),
    "Women",
  );
  assert.equal(shopifyAudience("Men’s Luxury PU Leather Moto Pants"), "Men");
  assert.equal(shopifyAudience("Youth unisex fleece"), "Kids");
  assert.equal(shopifyAudience("Streetwear for men and women"), "Unisex");
  assert.equal(shopifyAudience("Graphic tee 180 GSM"), "Not specified");
});
test("category inference distinguishes short sleeves, boot-cut jeans, shoes and fragrance", () => {
  const products = normalizeShopifyImport(imported).products;
  assert.equal(
    products.find((p) => p.name.startsWith("Opium Attitude"))?.category,
    "Tees & tops",
  );
  assert.equal(
    products.find((p) => p.name.startsWith("Jeans Flare"))?.category,
    "Bottoms",
  );
  assert.equal(
    products.find((p) => p.name.startsWith("NIKE Air Jordan 4"))?.category,
    "Footwear",
  );
  assert.equal(
    products.find((p) => p.name.startsWith("Le Labo"))?.category,
    "Fragrance",
  );
  assert.equal(
    products.find((p) => p.name.startsWith("Black Strap With 7"))?.category,
    "Accessories",
  );
});
test("partial, duplicate, and unsafe-image imports are rejected", () => {
  const partial = structuredClone(imported);
  partial.products[0].variants.pageInfo.hasNextPage = true;
  assert.equal(shopifyImportSchema.safeParse(partial).success, false);
  const duplicate = structuredClone(imported);
  duplicate.products.push(duplicate.products[0]);
  assert.equal(shopifyImportSchema.safeParse(duplicate).success, false);
  const unsafe = structuredClone(imported);
  unsafe.products[0].media.nodes[0].preview.image.url =
    "https://cdn.shopify.com.evil.invalid/test.jpg";
  assert.equal(shopifyImportSchema.safeParse(unsafe).success, false);
});
test("public catalog excludes raw HTML, inventory internals and unpublished products; Shopify IDs cannot pass Printful checkout", () => {
  const draft = structuredClone(imported);
  draft.products[0].status = "DRAFT";
  const catalog = normalizeShopifyImport(draft);
  assert.equal(catalog.products.length, 45);
  const rendered = JSON.stringify(catalog);
  assert.ok(!rendered.includes("descriptionHtml"));
  assert.ok(!rendered.includes("inventoryQuantity"));
  assert.ok(!rendered.includes("inventoryItem"));
  assert.equal(
    checkoutSchema.safeParse({
      items: [
        {
          productId: catalog.products[0].id,
          variantId: catalog.products[0].variants[0].id,
          quantity: 1,
        },
      ],
    }).success,
    false,
  );
});
