import { test } from "node:test";
import assert from "node:assert/strict";
import snapshot from "../src/data/catalog-snapshot.json" with { type: "json" };
import priceFile from "../src/data/price-overrides.json" with { type: "json" };
import specs from "../src/data/verified-specs.json" with { type: "json" };
import {
  applyCatalogPolicy,
  HIDDEN_CATALOG_VARIANT_IDS,
  priceOverridesEnabled,
  REMOVED_PRODUCT_IDS,
  unitPriceCents,
} from "../src/lib/catalog-policy";
import { normalizeProduct } from "../src/lib/normalize";
import { catalogDocumentTitles } from "../src/lib/product-title";
import { productData, schemaPrice } from "../src/lib/seo";
import type { Product, ProductVariant } from "../src/lib/types";

const products = snapshot.products as Product[];

function cents(price: string) {
  const [whole, fraction] = price.split(".");
  return Number(whole) * 100 + Number(fraction);
}

test("an overridden variant has one price for display, JSON-LD, and checkout", () => {
  assert.equal(priceOverridesEnabled(), true);
  const row = priceFile.overrides.find((item) => item.productId === 471749134);
  assert.ok(row);
  const raw = products.find((product) => product.id === row.productId);
  assert.ok(raw);
  const before = raw.variants.find((variant) => variant.id === row.variantId);
  assert.ok(before);
  const priced = applyCatalogPolicy(structuredClone(raw));
  assert.ok(priced);
  const variant = priced.variants.find((item) => item.id === row.variantId);
  assert.ok(variant);
  const expected = cents(row.price);
  assert.notEqual(before.priceCents, expected);
  assert.equal(variant.priceCents, expected);
  assert.equal(priced.priceCents, 2795);
  assert.equal(priced.maxPriceCents, 3495);
  assert.equal(priced.slug, raw.slug);

  const structured = productData(priced);
  const offer = structured.hasVariant.find(
    (item) => item.sku === `HD-${variant.id}`,
  );
  assert.ok(offer?.offers && "price" in offer.offers);
  assert.equal(offer.offers.price, schemaPrice(expected));
  assert.ok(
    structured.offers && structured.offers["@type"] === "AggregateOffer",
  );
  assert.equal(structured.offers.lowPrice, schemaPrice(priced.priceCents));
  assert.equal(structured.offers.highPrice, schemaPrice(priced.maxPriceCents));
  assert.equal(unitPriceCents(priced, variant.id), expected);

  const normalized = normalizeProduct({
    sync_product: {
      id: raw.id,
      name: raw.name,
      thumbnail_url: raw.image,
    },
    sync_variants: [
      {
        id: before.id,
        variant_id: before.catalogVariantId,
        name: before.name,
        synced: true,
        size: before.size,
        color: before.color,
        retail_price: (before.priceCents / 100).toFixed(2),
        currency: before.currency,
        availability_status: "active",
      },
    ],
  });
  assert.equal(normalized?.variants[0]?.priceCents, expected);
  assert.equal(normalized?.slug, raw.slug);
  assert.equal(unitPriceCents(normalized!, before.id), expected);
});

test("products without a price override keep Printful retail prices", () => {
  const untouched = products.find((product) => product.id === 471752024);
  const held = products.find((product) => product.id === 471749198);
  assert.ok(untouched);
  assert.ok(held);
  for (const raw of [untouched, held]) {
    const next = applyCatalogPolicy(structuredClone(raw));
    assert.ok(next);
    assert.deepEqual(
      next.variants.map((variant) => [variant.id, variant.priceCents]),
      raw.variants.map((variant) => [variant.id, variant.priceCents]),
    );
    assert.equal(next.priceCents, raw.priceCents);
    assert.equal(next.maxPriceCents, raw.maxPriceCents);
    assert.equal(next.slug, raw.slug);
    assert.equal(next.name, raw.name);
  }
  const overriddenIds = new Set(
    priceFile.overrides.map((row) => row.productId),
  );
  for (const id of [476368797, 476371270, 476461521, 471749198, 475170849])
    assert.equal(overriddenIds.has(id), false);
});

test("Stone 2XL catalog variant 21028 cannot be offered or purchased", () => {
  const raw = structuredClone(
    products.find((product) => product.id === 471749077)!,
  );
  const hidden: ProductVariant = {
    id: 999001,
    catalogVariantId: 21028,
    name: "Stomp the Yard / Stone / 2XL",
    size: "2XL",
    color: "Stone",
    priceCents: 3000,
    currency: "USD",
    image: null,
    stock: "available",
  };
  raw.variants.push(hidden);
  assert.equal(HIDDEN_CATALOG_VARIANT_IDS.has(21028), true);
  const next = applyCatalogPolicy(raw);
  assert.ok(next);
  assert.equal(
    next.variants.some((variant) => variant.catalogVariantId === 21028),
    false,
  );
  assert.equal(unitPriceCents(next, hidden.id), null);
  const structured = productData(next);
  const encoded = JSON.stringify(structured);
  assert.equal(encoded.includes("999001"), false);
  assert.equal(encoded.includes("Stone / 2XL"), false);
  assert.equal(
    structured.hasVariant.some(
      (variant) => variant.color === "Stone" && variant.size === "2XL",
    ),
    false,
  );
});

test("the Columbia fleece vest leaves the catalog", () => {
  const vest = products.find((product) => product.id === 471748994);
  assert.ok(vest);
  assert.equal(REMOVED_PRODUCT_IDS.has(vest.id), true);
  assert.equal(applyCatalogPolicy(vest), null);
  assert.equal(
    normalizeProduct({
      sync_product: {
        id: vest.id,
        name: vest.name,
        thumbnail_url: vest.image,
      },
      sync_variants: vest.variants.slice(0, 1).map((variant) => ({
        id: variant.id,
        variant_id: variant.catalogVariantId,
        name: variant.name,
        synced: true,
        size: variant.size,
        color: variant.color,
        retail_price: (variant.priceCents / 100).toFixed(2),
        currency: variant.currency,
        availability_status: "active",
      })),
    }),
    null,
  );
});

test("Gildan 5000 document titles drop heavyweight and keep slugs", () => {
  const gildan = Object.entries(specs)
    .filter(([, record]) => /Gildan \| 5000 \|/.test(record.blank ?? ""))
    .map(([id]) => Number(id));
  assert.equal(gildan.length, 14);
  const titles = catalogDocumentTitles(
    products.map((product) => ({ id: product.id, name: product.name })),
  );
  for (const id of gildan) {
    const title = titles.get(id);
    assert.ok(title);
    assert.doesNotMatch(title, /\bheavyweight\b/i);
    const product = products.find((item) => item.id === id);
    assert.ok(product);
    assert.equal(applyCatalogPolicy(product)?.slug, product.slug);
  }
  assert.match(
    products.find((product) => product.id === 471749168)?.slug ?? "",
    /heavyweight/,
  );
});
