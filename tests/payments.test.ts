import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertCapturedPayment,
  type PaymentEvidence,
} from "../src/lib/payment-proof";
import {
  orderSnapshotSchema,
  quoteRequestSchema,
  checkoutQuoteSchema,
} from "../src/lib/commerce-schema";
import {
  newSession,
  validSession,
  sessionHash,
} from "../src/lib/session-token";
const id = "01947832-4567-7abc-8def-123456789012";
const snapshot = orderSnapshotSchema.parse({
  cart: { items: [{ productId: 1, variantId: 2, quantity: 2 }] },
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
      quantity: 2,
      priceCents: 4999,
      currency: "USD",
      name: "Test tee",
    },
  ],
  currency: "USD",
  subtotalCents: 9998,
  shippingCents: 495,
  fulfillmentCostCents: 4300,
  quoteExpires: Date.now() + 60000,
  stripeExpires: Math.floor(Date.now() / 1000) + 3600,
  taxMode: "automatic",
  livemode: false,
});
const proof: PaymentEvidence = {
  sessionId: "cs_test_fixture",
  orderId: id,
  reference: id,
  sessionMode: "payment",
  sessionStatus: "complete",
  paid: true,
  automaticTax: true,
  taxStatus: "complete",
  livemode: false,
  currency: "usd",
  subtotal: 9998,
  shipping: 495,
  tax: 600,
  discount: 0,
  total: 11093,
  paymentId: "pi_fixture",
  paymentOrderId: id,
  paymentStatus: "succeeded",
  received: 11093,
  paymentCurrency: "usd",
  paymentLive: false,
  refunded: false,
  disputed: false,
  chargePaid: true,
  chargeCaptured: true,
  delivery: {
    name: "Test Customer",
    address1: "100 Example St",
    address2: "",
    city: "Richmond",
    state: "VA",
    zip: "23220",
    country: "US",
  },
  lines: [
    {
      variantId: "2",
      productId: "1",
      quantity: 2,
      unitAmount: 4999,
      subtotal: 9998,
      currency: "usd",
    },
  ],
};
test("captured receipt must match immutable merchandise, delivery, shipping and tax", () => {
  const captured = assertCapturedPayment(id, snapshot, proof);
  assert.equal(captured.merchandiseTotalCents, 9998);
  assert.equal(captured.paymentId, "pi_fixture");
});
for (const [name, changes] of Object.entries({
  unpaid: { paid: false },
  tax_not_configured: { automaticTax: false },
  tax_not_final: { taxStatus: "failed" },
  async_pending: { paymentStatus: "processing" },
  partial_capture: { received: 100 },
  refunded: { refunded: true },
  disputed: { disputed: true },
  uncaptured: { chargeCaptured: false },
  live_test_mix: { livemode: true },
  wrong_order: { orderId: "different" },
  wrong_payment_order: { paymentOrderId: "different" },
  wrong_currency: { paymentCurrency: "eur" },
  discount: { discount: 100 },
  tax_tamper: { tax: -100 },
  price_tamper: { subtotal: 2 },
  shipping_tamper: { shipping: 99 },
  address_tamper: { delivery: { ...proof.delivery!, zip: "90210" } },
  variant_tamper: { lines: [{ ...proof.lines[0], variantId: "999" }] },
  quantity_tamper: { lines: [{ ...proof.lines[0], quantity: 1 }] },
  duplicate_lines: { lines: [...proof.lines, ...proof.lines] },
})) {
  test(`payment refuses ${name}`, () =>
    assert.throws(() =>
      assertCapturedPayment(id, snapshot, {
        ...proof,
        ...changes,
      } as PaymentEvidence),
    ));
}
test("checkout accepts only an owned quote reference, never browser totals", () => {
  assert.equal(checkoutQuoteSchema.safeParse({ quoteId: id }).success, true);
  assert.equal(
    checkoutQuoteSchema.safeParse({ quoteId: id, total: 1 }).success,
    false,
  );
  assert.equal(
    quoteRequestSchema.safeParse({
      cart: {
        items: [{ productId: 1, variantId: 2, quantity: 1, priceCents: 1 }],
      },
      recipient: snapshot.recipient,
    }).success,
    false,
  );
});
test("browser tokens reject forgery, future timestamps and expiry", () => {
  const secret = "test-secret-for-session-signing-only";
  const now = 1800000000000;
  const token = newSession(secret, now);
  assert.ok(validSession(token, secret, now));
  assert.equal(validSession(token, "different-secret", now), false);
  assert.equal(validSession(token, secret, now + 31 * 86400000), false);
  assert.equal(
    validSession(newSession(secret, now + 90000), secret, now),
    false,
  );
  assert.equal(validSession(token.slice(1), secret, now), false);
  assert.equal(sessionHash(token).length, 64);
});
