import type { OrderSnapshot } from "./commerce-schema";
export interface PaymentEvidence {
  sessionId: string;
  orderId: string | null;
  reference: string | null;
  sessionMode: string | null;
  sessionStatus: string | null;
  paid: boolean;
  automaticTax: boolean;
  taxStatus: string | null;
  livemode: boolean;
  currency: string | null;
  subtotal: number | null;
  shipping: number | null;
  tax: number | null;
  discount: number | null;
  total: number | null;
  paymentId: string;
  paymentOrderId: string | null;
  paymentStatus: string;
  received: number;
  paymentCurrency: string;
  paymentLive: boolean;
  refunded: boolean;
  disputed: boolean;
  chargePaid: boolean;
  chargeCaptured: boolean;
  delivery: {
    name: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null;
  lines: {
    variantId: string | undefined;
    productId: string | undefined;
    quantity: number | null;
    unitAmount: number | null;
    subtotal: number;
    currency: string;
  }[];
}
export function assertCapturedPayment(
  id: string,
  snapshot: OrderSnapshot,
  proof: PaymentEvidence,
) {
  const fail = () => {
    throw new Error("Payment verification requires review");
  };
  if (
    proof.orderId !== id ||
    proof.reference !== id ||
    proof.paymentOrderId !== id ||
    proof.sessionMode !== "payment" ||
    proof.sessionStatus !== "complete"
  )
    fail();
  if (
    !proof.paid ||
    proof.livemode !== snapshot.livemode ||
    proof.paymentLive !== snapshot.livemode ||
    proof.paymentStatus !== "succeeded" ||
    !proof.chargePaid ||
    !proof.chargeCaptured ||
    proof.refunded ||
    proof.disputed
  )
    fail();
  if (
    snapshot.taxMode === "automatic" &&
    (!proof.automaticTax || proof.taxStatus !== "complete")
  )
    fail();
  if (snapshot.taxMode === "test_none" && proof.automaticTax) fail();
  if (
    proof.currency !== "usd" ||
    proof.paymentCurrency !== "usd" ||
    proof.subtotal !== snapshot.subtotalCents ||
    proof.shipping !== snapshot.shippingCents ||
    proof.discount !== 0
  )
    fail();
  if (
    !Number.isSafeInteger(proof.tax) ||
    proof.tax! < 0 ||
    (snapshot.taxMode === "test_none" && proof.tax !== 0)
  )
    fail();
  if (
    proof.total !==
      snapshot.subtotalCents + snapshot.shippingCents + proof.tax! ||
    proof.received !== proof.total
  )
    fail();
  if (proof.lines.length !== snapshot.lines.length) fail();
  const found = new Set<string>();
  for (const line of proof.lines) {
    const expected = snapshot.lines.find(
      (item) => String(item.variantId) === line.variantId,
    );
    if (
      !expected ||
      found.has(line.variantId!) ||
      line.productId !== String(expected.productId) ||
      line.quantity !== expected.quantity ||
      line.unitAmount !== expected.priceCents ||
      line.subtotal !== expected.quantity * expected.priceCents ||
      line.currency !== "usd"
    )
      fail();
    found.add(line.variantId!);
  }
  const d = proof.delivery,
    r = snapshot.recipient;
  if (
    !d ||
    d.name !== r.name ||
    d.address1 !== r.address1 ||
    d.address2 !== (r.address2 || "") ||
    d.city !== r.city ||
    d.state !== r.state_code ||
    d.zip !== r.zip ||
    d.country !== r.country_code
  )
    fail();
  return {
    paymentId: proof.paymentId,
    provider: "stripe",
    captured: true as const,
    currency: snapshot.currency,
    merchandiseTotalCents: snapshot.subtotalCents,
    recipient: r,
    cart: snapshot.cart,
  };
}
