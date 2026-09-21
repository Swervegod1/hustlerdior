import { z } from "zod";
import { stripeClient } from "@/lib/server/stripe";
import { readBytes, privateHeaders } from "@/lib/server/http";
import { transaction } from "@/lib/server/database";
import { processPaidOrder } from "@/lib/server/payment-worker";
import { hasDatabase } from "@/lib/env";
import type Stripe from "stripe";
export const runtime = "nodejs";
const supported = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret)
    return Response.json(
      { error: "Webhook unavailable." },
      { status: secret ? 400 : 503, headers: privateHeaders },
    );
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(
      await readBytes(request, 1024 * 1024),
      signature,
      secret,
    );
  } catch {
    return Response.json(
      { error: "Invalid webhook." },
      { status: 400, headers: privateHeaders },
    );
  }
  if (!supported.has(event.type))
    return Response.json({ received: true }, { headers: privateHeaders });
  const session = event.data.object as Stripe.Checkout.Session;
  const id = z.uuid().safeParse(session.metadata?.hd_order_id);
  if (!id.success)
    return Response.json({ received: true }, { headers: privateHeaders });
  if (hasDatabase()) {
    try {
      await transaction(async (client) => {
        const result = await client.query(
          "SELECT snapshot,stripe_session_id FROM hd_orders WHERE id=$1 FOR UPDATE",
          [id.data],
        );
        const order = result.rows[0];
        if (!order) return;
        if (
          event.livemode !== session.livemode ||
          session.client_reference_id !== id.data ||
          (order.stripe_session_id && order.stripe_session_id !== session.id)
        )
          throw new Error("Webhook mismatch");
        await client.query(
          "UPDATE hd_orders SET stripe_session_id=$2 WHERE id=$1 AND stripe_session_id IS NULL",
          [id.data, session.id],
        );
        await client.query(
          "INSERT INTO hd_payment_jobs(event_id,order_id) VALUES ($1,$2) ON CONFLICT (event_id) DO NOTHING",
          [event.id, id.data],
        );
      });
    } catch {
      return Response.json(
        { error: "Retry webhook delivery." },
        { status: 503, headers: privateHeaders },
      );
    }
  }
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed" ||
    event.type === "checkout.session.expired"
  ) {
    try {
      await processPaidOrder(id.data, session);
    } catch {
      return Response.json(
        { error: "Retry webhook delivery." },
        { status: 503, headers: privateHeaders },
      );
    }
  }
  return Response.json({ received: true }, { headers: privateHeaders });
}
