import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeDrafts,
  validateImport,
} from "../scripts/stage-supplier-import.mjs";

function input() {
  return {
    schemaVersion: 1,
    livePublished: 0,
    products: [
      {
        id: "rarefoot:one",
        sourceUrl: "https://rarefoot.com/product/one/",
        status: "draft",
        saleEnabled: false,
        fulfillmentConfigured: false,
        variants: [
          {
            sourceVariantId: "123",
            sourceSku: "one-9",
            size: "US Men's 9",
            color: "Black/Red",
            sourcePriceCents: 13099,
            currency: "USD",
            sourceInStock: null,
            saleEnabled: false,
            retailPriceCents: null,
          },
        ],
      },
    ],
  };
}

test("supplier import rerun matches IDs and preserves merchant decisions and unrelated drafts", () => {
  const first = mergeDrafts(undefined, input());
  first.queue.products[0].merchant.retailPrices = { "123": 19000 };
  first.queue.products.push({ id: "unrelated", merchant: { note: "keep" } });
  const next = mergeDrafts(first.queue, input());
  assert.equal(next.added, 0);
  assert.equal(next.matched, 1);
  assert.equal(next.queue.products.length, 2);
  assert.equal(next.queue.products[0].merchant.retailPrices["123"], 19000);
  assert.equal(next.queue.products[1].merchant.note, "keep");
  assert.equal(
    next.queue.products[0].observation.variants[0].sourceInStock,
    null,
  );
});
test("supplier import refuses activation, duplicate variants and unknown hosts", () => {
  const enabled = input();
  enabled.products[0].saleEnabled = true;
  assert.throws(() => validateImport(enabled));
  const duplicates = input();
  duplicates.products[0].variants.push(duplicates.products[0].variants[0]);
  assert.throws(() => validateImport(duplicates));
  const host = input();
  host.products[0].sourceUrl = "https://example.com/product/one/";
  assert.throws(() => validateImport(host));
});
