import { test } from "node:test";
import assert from "node:assert/strict";
import { checkoutConfigured, stripeKeyValid } from "../src/lib/env";

test("checkout never opens with only Stripe and Printful credentials", () => {
  const keys = [
    "STRIPE_SECRET_KEY", "PRINTFUL_API_TOKEN", "PRINTFUL_STORE_ID",
    "DATABASE_URL", "CHECKOUT_ENABLED", "PAYMENT_WORKER_READY",
    "STORE_POLICIES_APPROVED",
  ] as const;
  const prior = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    Object.assign(process.env, {
      STRIPE_SECRET_KEY: "sk_test_fixture_not_real",
      PRINTFUL_API_TOKEN: "printful-test-fixture",
      PRINTFUL_STORE_ID: "12345",
      CHECKOUT_ENABLED: "true",
    });
    delete process.env.DATABASE_URL;
    delete process.env.PAYMENT_WORKER_READY;
    delete process.env.STORE_POLICIES_APPROVED;
    assert.equal(stripeKeyValid(), true);
    assert.equal(checkoutConfigured(), false);
    process.env.DATABASE_URL = "postgres://fixture.invalid/test";
    assert.equal(checkoutConfigured(), false);
    process.env.PAYMENT_WORKER_READY = "true";
    assert.equal(checkoutConfigured(), false);
    process.env.STORE_POLICIES_APPROVED = "true";
    assert.equal(checkoutConfigured(), true);
    process.env.CHECKOUT_ENABLED = "false";
    assert.equal(checkoutConfigured(), false);
  } finally {
    for (const key of keys) {
      if (prior[key] === undefined) delete process.env[key];
      else process.env[key] = prior[key];
    }
  }
});
