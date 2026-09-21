import { test } from "node:test";
import assert from "node:assert/strict";
import {
  catalogUsesSnapshot,
  checkoutConfigured,
  printfulConfigured,
  printfulToken,
  sessionSecret,
  stripeKeyValid,
} from "../src/lib/env";
import {
  ownerFromMetadata,
  snapshotFromMetadata,
  snapshotMetadata,
} from "../src/lib/order-snapshot-meta";
import { orderSnapshotSchema } from "../src/lib/commerce-schema";

const keys = [
  "PRINTFUL_API_TOKEN",
  "PRINTFUL_API_KEY",
  "PRINTFUL_STORE_ID",
  "STRIPE_SECRET_KEY",
  "CHECKOUT_ENABLED",
  "APP_SESSION_SECRET",
  "CATALOG_SNAPSHOT_PREVIEW",
  "DATABASE_URL",
] as const;

function withEnv(values: Partial<Record<(typeof keys)[number], string | undefined>>, fn: () => void) {
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) {
      const value = values[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fn();
  } finally {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("Printful accepts PRINTFUL_API_TOKEN or PRINTFUL_API_KEY", () => {
  withEnv(
    {
      PRINTFUL_API_TOKEN: undefined,
      PRINTFUL_API_KEY: "hostinger-token-alias",
      PRINTFUL_STORE_ID: "12345",
    },
    () => {
      assert.equal(printfulToken(), "hostinger-token-alias");
      assert.equal(printfulConfigured(), true);
    },
  );
  withEnv(
    {
      PRINTFUL_API_TOKEN: "preferred-token",
      PRINTFUL_API_KEY: "alias-token",
      PRINTFUL_STORE_ID: "12345",
    },
    () => {
      assert.equal(printfulToken(), "preferred-token");
    },
  );
});

test("snapshot preview is skipped when Printful is configured", () => {
  withEnv(
    {
      CATALOG_SNAPSHOT_PREVIEW: "true",
      PRINTFUL_API_TOKEN: "token",
      PRINTFUL_STORE_ID: "12345",
    },
    () => assert.equal(catalogUsesSnapshot(), false),
  );
  withEnv(
    {
      CATALOG_SNAPSHOT_PREVIEW: "true",
      PRINTFUL_API_TOKEN: undefined,
      PRINTFUL_API_KEY: undefined,
      PRINTFUL_STORE_ID: undefined,
    },
    () => assert.equal(catalogUsesSnapshot(), true),
  );
});

test("checkout opens for a valid Stripe secret unless explicitly disabled", () => {
  withEnv(
    {
      STRIPE_SECRET_KEY: "sk_test_notasecret_placeholder_value",
      CHECKOUT_ENABLED: undefined,
      DATABASE_URL: undefined,
      APP_SESSION_SECRET: undefined,
    },
    () => {
      assert.equal(stripeKeyValid(), true);
      assert.equal(checkoutConfigured(), true);
      assert.ok((sessionSecret()?.length ?? 0) >= 32);
    },
  );
  withEnv(
    {
      STRIPE_SECRET_KEY: "sk_live_notasecret_placeholder_value",
      CHECKOUT_ENABLED: "false",
    },
    () => assert.equal(checkoutConfigured(), false),
  );
  withEnv(
    { STRIPE_SECRET_KEY: undefined, CHECKOUT_ENABLED: "true" },
    () => assert.equal(checkoutConfigured(), false),
  );
});

test("order snapshots round-trip through Stripe metadata chunks", () => {
  const snapshot = orderSnapshotSchema.parse({
    cart: { items: [{ productId: 1, variantId: 2, quantity: 1 }] },
    recipient: {
      name: "Test Customer",
      email: "test@example.invalid",
      address1: "100 Example St",
      city: "Richmond",
      state_code: "VA",
      country_code: "US",
      zip: "23220",
    },
    lines: [
      {
        productId: 1,
        variantId: 2,
        quantity: 1,
        priceCents: 4999,
        currency: "USD",
        name: "Test tee",
      },
    ],
    currency: "USD",
    subtotalCents: 4999,
    shippingCents: 495,
    fulfillmentCostCents: 2100,
    quoteExpires: Date.now() + 60000,
    stripeExpires: Math.floor(Date.now() / 1000) + 3600,
    taxMode: "test_none",
    livemode: false,
  });
  const owner = "a".repeat(64);
  const id = "01947832-4567-7abc-8def-123456789012";
  const metadata = snapshotMetadata(id, owner, snapshot, {
    integration: "hustlerdior_QuvNerZa",
  });
  assert.equal(metadata.hd_order_id, id);
  assert.ok(Object.values(metadata).every((value) => value.length <= 500));
  assert.deepEqual(snapshotFromMetadata(metadata), snapshot);
  assert.equal(ownerFromMetadata(metadata), owner);
});
