import "server-only";
import { randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { database } from "./database";
import { loadOrder } from "./orders";
import { stripeClient } from "./stripe";
import { createPrintfulDraft } from "./fulfillment";
import { assertCapturedPayment } from "../payment-proof";

export async function processPaidOrder(id: string) {
  const order = await loadOrder(id);
  if (!order.stripe_session_id) throw new Error("Missing checkout reference");
  // Reverify even on replay; refunds/disputes must not authorize another fulfillment operation.
  const stripe = stripeClient();
  const session = await stripe.checkout.sessions.retrieve(
    order.stripe_session_id,
  );
  if (session.payment_status !== "paid") {
    let status = session.status === "expired" ? "expired" : "awaiting_payment";
    const pendingId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    if (session.status === "complete" && pendingId) {
      const pending = await stripe.paymentIntents.retrieve(pendingId);
      if (["canceled", "requires_payment_method"].includes(pending.status))
        status = "payment_failed";
    }
    if (status !== "awaiting_payment")
      await database().query(
        "UPDATE hd_orders SET status=$2,updated_at=now() WHERE id=$1 AND status IN ('quoted','checkout')",
        [id, status],
      );
    return status;
  }
  const paymentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!paymentId) throw new Error("Missing payment reference");
  const [payment, lines] = await Promise.all([
    stripe.paymentIntents.retrieve(paymentId, { expand: ["latest_charge"] }),
    stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
      expand: ["data.price.product"],
    }),
  ]);
  if (lines.has_more) throw new Error("Unexpected checkout items");
  const charge = payment.latest_charge as Stripe.Charge | null;
  if (!charge || typeof charge === "string")
    throw new Error("Missing charge proof");
  const shipping = payment.shipping;
  const paid = assertCapturedPayment(id, order.snapshot, {
    sessionId: session.id,
    orderId: session.metadata?.hd_order_id ?? null,
    reference: session.client_reference_id,
    sessionMode: session.mode,
    sessionStatus: session.status,
    paid: session.payment_status === "paid",
    automaticTax: session.automatic_tax.enabled,
    taxStatus: session.automatic_tax.status,
    livemode: session.livemode,
    currency: session.currency,
    subtotal: session.amount_subtotal,
    shipping: session.total_details?.amount_shipping ?? null,
    tax: session.total_details?.amount_tax ?? null,
    discount: session.total_details?.amount_discount ?? null,
    total: session.amount_total,
    paymentId: payment.id,
    paymentOrderId: payment.metadata.hd_order_id ?? null,
    paymentStatus: payment.status,
    received: payment.amount_received,
    paymentCurrency: payment.currency,
    paymentLive: payment.livemode,
    refunded: charge.refunded || charge.amount_refunded > 0,
    disputed: charge.disputed,
    chargePaid: charge.paid,
    chargeCaptured: charge.captured,
    delivery: shipping
      ? {
          name: shipping.name ?? "",
          address1: shipping.address?.line1 ?? "",
          address2: shipping.address?.line2 ?? "",
          city: shipping.address?.city ?? "",
          state: shipping.address?.state ?? "",
          zip: shipping.address?.postal_code ?? "",
          country: shipping.address?.country ?? "",
        }
      : null,
    lines: lines.data.map((line) => {
      const product = line.price?.product as Stripe.Product | undefined;
      return {
        variantId: product?.metadata?.hd_variant_id,
        productId: product?.metadata?.hd_product_id,
        quantity: line.quantity,
        unitAmount: line.price?.unit_amount ?? null,
        subtotal: line.amount_subtotal,
        currency: line.currency,
      };
    }),
  });
  if (order.status === "draft_created") return "draft_created";
  await database().query(
    "UPDATE hd_orders SET stripe_payment_id=$2,status=CASE WHEN status='draft_created' THEN status ELSE 'paid' END,updated_at=now() WHERE id=$1 AND (stripe_payment_id IS NULL OR stripe_payment_id=$2)",
    [id, paymentId],
  );
  const draft = await createPrintfulDraft(paymentId, {
    loadCapturedOrder: async (requestedId) => {
      if (requestedId !== paid.paymentId) throw new Error("Payment mismatch");
      return paid;
    },
  });
  await database().query(
    "UPDATE hd_orders SET printful_order_id=$2,status='draft_created',updated_at=now() WHERE id=$1 AND stripe_payment_id=$3",
    [id, draft.id, paymentId],
  );
  return "draft_created";
}
export const CLAIM_JOB_SQL = `UPDATE hd_payment_jobs SET lease_token=$1,lease_until=now()+interval '10 minutes',attempts=attempts+1
 WHERE event_id=(SELECT event_id FROM hd_payment_jobs WHERE done=false AND attempts<8 AND available_at<=now() AND (lease_until IS NULL OR lease_until<now()) ORDER BY available_at FOR UPDATE SKIP LOCKED LIMIT 1)
 RETURNING event_id,order_id,attempts`;
export async function workPaymentJobs(max = 10) {
  for (let index = 0; index < max; index++) {
    const token = randomUUID();
    const claimed = await database().query(CLAIM_JOB_SQL, [token]);
    const job = claimed.rows[0];
    if (!job) break;
    try {
      await processPaidOrder(job.order_id);
      await database().query(
        "UPDATE hd_payment_jobs SET done=true,lease_until=NULL,last_error=NULL WHERE event_id=$1 AND lease_token=$2",
        [job.event_id, token],
      );
    } catch {
      // Store a generic operational code, never upstream responses or recipient information.
      const delay = Math.min(3600, 15 * 2 ** job.attempts);
      await database().query(
        "UPDATE hd_payment_jobs SET available_at=now()+($3 * interval '1 second'),lease_until=NULL,last_error='verification_or_fulfillment_retry' WHERE event_id=$1 AND lease_token=$2",
        [job.event_id, token, delay],
      );
      if (job.attempts >= 8)
        await database().query(
          "UPDATE hd_orders SET status='manual_review',updated_at=now() WHERE id=$1 AND status<>'draft_created'",
          [job.order_id],
        );
    }
  }
}
