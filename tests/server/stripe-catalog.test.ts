import { test } from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import { resolveCatalogPrices } from "../../src/lib/server/stripe-catalog";
import type { CatalogManifest } from "../../src/lib/stripe-catalog";

test("checkout resolves persistent Prices only for its authenticated account, store and mode", async () => {
  const previous = {
    key: process.env.STRIPE_SECRET_KEY,
    store: process.env.PRINTFUL_STORE_ID,
  };
  process.env.STRIPE_SECRET_KEY = "sk_test_fixture_only";
  process.env.PRINTFUL_STORE_ID = "123";
  const mapping = {
    productId: 1,
    variantId: 2,
    catalogVariantId: 3,
    stripeProductId: "prod_fixture",
    priceId: "price_fixture",
    unitAmount: 2500,
    currency: "usd",
    size: "M",
    color: "Black",
  };
  const catalog: CatalogManifest = {
    version: 1,
    catalogs: [
      {
        accountId: "acct_fixture",
        livemode: false,
        storeId: "123",
        complete: true,
        fetchedAt: "2026-11-04",
        sourceUrl: "https://api.printful.com/store/products",
        entries: [mapping],
      },
    ],
  };
  const lines = [
    {
      productId: 1,
      variantId: 2,
      quantity: 2,
      priceCents: 2500,
      currency: "USD" as const,
      name: "Test tee",
    },
  ];
  let accountId = "acct_fixture",
    unitAmount = 2500,
    priceReads = 0;
  const stripe = {
    accounts: {
      retrieve: async () => ({ id: accountId, charges_enabled: true }),
    },
    prices: {
      retrieve: async (id: string) => {
        priceReads++;
        assert.equal(id, "price_fixture");
        return {
          id,
          active: true,
          livemode: false,
          type: "one_time",
          billing_scheme: "per_unit",
          recurring: null,
          unit_amount: unitAmount,
          currency: "usd",
          tax_behavior: "exclusive",
          metadata: {
            printful_sync_product_id: "1",
            printful_sync_variant_id: "2",
            printful_catalog_variant_id: "3",
          },
          product: {
            id: "prod_fixture",
            active: true,
            livemode: false,
            metadata: {
              printful_sync_product_id: "1",
              printful_store_id: "123",
              storefront: "https://hustlerdior.com",
            },
          },
        };
      },
    },
  } as unknown as Stripe;
  try {
    assert.deepEqual(await resolveCatalogPrices(stripe, lines, catalog), [
      { price: "price_fixture", quantity: 2 },
    ]);
    accountId = "acct_wrong";
    await assert.rejects(() => resolveCatalogPrices(stripe, lines, catalog));
    assert.equal(
      priceReads,
      1,
      "Wrong account must stop before resolving a Price",
    );
    accountId = "acct_fixture";
    unitAmount = 1;
    await assert.rejects(() => resolveCatalogPrices(stripe, lines, catalog));
    unitAmount = 2500;
    await assert.rejects(() =>
      resolveCatalogPrices(stripe, [{ ...lines[0], priceCents: 100 }], catalog),
    );
    await assert.rejects(() =>
      resolveCatalogPrices(stripe, lines, { version: 1, catalogs: [] }),
    );
    process.env.STRIPE_SECRET_KEY = "sk_live_fixture_only";
    await assert.rejects(() => resolveCatalogPrices(stripe, lines, catalog));
  } finally {
    if (previous.key === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previous.key;
    if (previous.store === undefined) delete process.env.PRINTFUL_STORE_ID;
    else process.env.PRINTFUL_STORE_ID = previous.store;
  }
});
