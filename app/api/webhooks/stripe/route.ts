import Stripe from "stripe";
import { PrintfulClient } from "@/src/lib/printful/client";
import { stripeClient } from "@/src/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PackedItem = { p?: string; v?: string; q?: number };

function packedItems(session: Stripe.Checkout.Session): Array<{
  sync_variant_id: number;
  quantity: number;
}> {
  const raw = session.metadata?.items;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PackedItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        sync_variant_id: Number(item.v),
        quantity: Number(item.q),
      }))
      .filter(
        (item) =>
          Number.isInteger(item.sync_variant_id) &&
          item.sync_variant_id > 0 &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0,
      );
  } catch {
    return [];
  }
}

function shippingFrom(session: Stripe.Checkout.Session) {
  const collected = session.collected_information?.shipping_details;
  const legacy = (
    session as Stripe.Checkout.Session & {
      shipping_details?: {
        name?: string | null;
        address?: {
          line1?: string | null;
          line2?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          postal_code?: string | null;
        } | null;
      } | null;
    }
  ).shipping_details;
  const shipping = collected || legacy;
  const address = shipping?.address;
  const email = session.customer_details?.email || undefined;
  const phone = session.customer_details?.phone || undefined;
  const name = shipping?.name || session.customer_details?.name;
  if (!name || !address?.line1 || !address.city || !address.country || !address.postal_code) {
    return null;
  }
  return {
    name,
    email,
    phone,
    address1: address.line1,
    address2: address.line2 || undefined,
    city: address.city,
    state_code: address.state || undefined,
    country_code: address.country,
    zip: address.postal_code,
  };
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return Response.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set. Payments still work; fulfillment is manual." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing Stripe-Signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return Response.json({ received: true, skipped: "unpaid" });
  }

  const items = packedItems(session);
  const recipient = shippingFrom(session);
  if (!items.length || !recipient) {
    return Response.json(
      { received: true, skipped: "missing-fulfillment-data" },
      { status: 200 },
    );
  }

  if (!PrintfulClient.isConfigured()) {
    return Response.json({ received: true, skipped: "printful-unconfigured" });
  }

  await PrintfulClient.createOrder({
    recipient,
    items,
    stripeSessionId: session.id,
  });

  return Response.json({ received: true, fulfilled: true });
}
