import { test } from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import { checkoutRequirements } from "../src/lib/checkout-readiness.mjs";
import {
  planCatalog,
  assertMappedPrice,
  priceCreateParams,
  productCreateParams,
} from "../src/lib/stripe-catalog";
import type { Product } from "../src/lib/types";

const scope = { accountId: "acct_fixture", livemode: false, storeId: "123" };
const product: Product = {
  id: 10,
  name: "Test tee",
  slug: "test-tee-10",
  image: null,
  category: "Tees",
  audience: "Unisex",
  currency: "USD",
  priceCents: 2500,
  maxPriceCents: 2500,
  variants: [
    {
      id: 20,
      catalogVariantId: 30,
      name: "Test tee / Black / M",
      color: "Black",
      size: "M",
      image: null,
      stock: "available",
      priceCents: 2500,
      currency: "USD",
    },
  ],
};
const parent = {
  ...productCreateParams(product, scope),
  id: "hd_pf_10",
  object: "product",
  active: true,
  livemode: false,
} as Stripe.Product;
const price = {
  ...priceCreateParams(product, product.variants[0], parent.id, scope),
  id: "price_fixture",
  object: "price",
  active: true,
  livemode: false,
  created: 1,
  type: "one_time",
  billing_scheme: "per_unit",
  recurring: null,
  transform_quantity: null,
  custom_unit_amount: null,
} as Stripe.Price;

test("catalog import rerun reuses exact records, including legacy variant lookup keys", () => {
  const empty = planCatalog([product], [], [], scope);
  assert.equal(empty.missingProducts.length, 1);
  assert.equal(empty.missingPrices.length, 1);
  const once = planCatalog(
    [product],
    [parent],
    [{ ...price, lookup_key: "pf_variant_20" }],
    scope,
  );
  assert.equal(once.missingProducts.length, 0);
  assert.equal(once.missingPrices.length, 0);
  assert.equal(once.mappings[0].priceId, "price_fixture");
  assert.deepEqual(planCatalog([product], [parent], [price], scope), once);
});

test("prices remain immutable: a retail change plans a distinct versioned lookup key", () => {
  const revised = {
    ...product,
    variants: [{ ...product.variants[0], priceCents: 2900 }],
  };
  const plan = planCatalog([revised], [parent], [price], scope);
  assert.equal(plan.mappings.length, 0);
  assert.equal(plan.missingPrices[0].params.unit_amount, 2900);
  assert.notEqual(plan.missingPrices[0].params.lookup_key, price.lookup_key);
  assert.equal(price.unit_amount, 2500);
});

test("unavailable variants are skipped and duplicate source IDs fail closed", () => {
  for (const stock of ["out_of_stock", "discontinued", "unknown"] as const) {
    const plan = planCatalog(
      [{ ...product, variants: [{ ...product.variants[0], stock }] }],
      [parent],
      [price],
      scope,
    );
    assert.equal(plan.skipped[0].reason, stock);
    assert.equal(plan.mappings.length + plan.missingPrices.length, 0);
  }
  assert.throws(() =>
    planCatalog([product, product], [parent], [price], scope),
  );
  assert.throws(() =>
    planCatalog(
      [{ ...product, variants: [product.variants[0], product.variants[0]] }],
      [parent],
      [price],
      scope,
    ),
  );
});

test("wrong store/mode, archived collisions and ambiguous Products cannot be adopted", () => {
  assert.throws(() =>
    planCatalog([product], [{ ...parent, livemode: true }], [price], scope),
  );
  assert.throws(() =>
    planCatalog([product], [{ ...parent, active: false }], [price], scope),
  );
  assert.throws(() =>
    planCatalog(
      [product],
      [parent, { ...parent, id: "another" }],
      [price],
      scope,
    ),
  );
  assert.throws(() =>
    planCatalog(
      [product],
      [
        {
          ...parent,
          metadata: { ...parent.metadata, printful_store_id: "456" },
        },
      ],
      [price],
      scope,
    ),
  );
  const other = { ...parent, id: "unrelated", metadata: {} };
  assert.equal(
    planCatalog([product], [other], [price], scope).missingProducts.length,
    1,
  );
});

test("checkout rejects tampered, archived, recurring, transformed and wrong-mode Prices", () => {
  const mapping = planCatalog([product], [parent], [price], scope).mappings[0];
  const expanded = { ...price, product: parent };
  assert.doesNotThrow(() => assertMappedPrice(expanded, mapping, scope));
  for (const change of [
    { unit_amount: 1 },
    { currency: "eur" },
    { active: false },
    { livemode: true },
    { type: "recurring" },
    { transform_quantity: { divide_by: 2, round: "up" } },
    { metadata: {} },
    { product: { ...parent, active: false } },
  ]) {
    assert.throws(() =>
      assertMappedPrice(
        { ...expanded, ...change } as Stripe.Price,
        mapping,
        scope,
      ),
    );
  }
});

test("readiness requires explicit enablement, storage, worker and policies", () => {
  const env = {
    CHECKOUT_ENABLED: "true",
    STRIPE_SECRET_KEY: "sk_test_fixture",
    PRINTFUL_API_TOKEN: "fixture",
    PRINTFUL_STORE_ID: "123",
    DATABASE_URL: "postgresql://fixture.invalid/test",
    PAYMENT_WORKER_READY: "true",
    STORE_POLICIES_APPROVED: "true",
  };
  assert.ok(Object.values(checkoutRequirements(env)).every(Boolean));
  for (const key of Object.keys(env)) {
    const missing = { ...env } as Record<string, string>;
    delete missing[key];
    assert.equal(
      Object.values(checkoutRequirements(missing)).every(Boolean),
      false,
      key,
    );
  }
  assert.equal(
    checkoutRequirements({ ...env, CHECKOUT_ENABLED: "false" })
      .CHECKOUT_ENABLED,
    false,
  );
  assert.equal(
    checkoutRequirements({ ...env, CHECKOUT_ENABLED: "1" }).CHECKOUT_ENABLED,
    false,
  );
});
