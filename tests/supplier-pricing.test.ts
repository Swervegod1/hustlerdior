import assert from "node:assert/strict";
import test from "node:test";
import {
  markedUpCents,
  priceDrafts,
  DOMAINS,
} from "../scripts/price-supplier-drafts.mjs";
test("7 percent markup rounds half cents up and rejects invalid amounts", () => {
  assert.equal(markedUpCents(13099), 14016);
  assert.equal(markedUpCents(14799), 15835);
  assert.equal(markedUpCents(50), 54);
  for (const value of [-1, 0, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER])
    assert.throws(() => markedUpCents(value));
});
test("rerun does not compound markup, change source or enable sales", () => {
  const source = {
    id: "rarefoot:test",
    sourceUrl: "https://rarefoot.com/product/test/",
    status: "draft",
    saleEnabled: false,
    fulfillmentConfigured: false,
    variants: [
      {
        sourceVariantId: "v1",
        sourcePriceCents: 13099,
        retailPriceCents: null,
        currency: "USD",
        sourceInStock: null,
        saleEnabled: false,
      },
    ],
  };
  const manifest = { schemaVersion: 1, livePublished: 0, products: [source] };
  const queue = {
    schemaVersion: 1,
    products: [
      {
        id: source.id,
        observation: source,
        merchant: {
          status: "draft",
          saleEnabled: false,
          fulfillment: "not-configured",
          retailPrices: {},
        },
      },
      { id: "unrelated", merchant: { note: "preserve" } },
    ],
  };
  const first = priceDrafts(queue, manifest);
  const second = priceDrafts(first.queue, manifest);
  assert.deepEqual(first, second);
  assert.deepEqual(first.queue.products[0].merchant.targetDomains, DOMAINS);
  assert.equal(first.queue.products[0].merchant.retailPrices.v1, 14016);
  assert.equal(first.queue.products[0].merchant.saleEnabled, false);
  assert.equal(
    first.queue.products[0].observation.variants[0].retailPriceCents,
    null,
  );
  assert.equal(first.queue.products[1].merchant.note, "preserve");
  assert.deepEqual(queue.products[0].merchant.retailPrices, {});
});
