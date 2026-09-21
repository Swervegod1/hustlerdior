import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { database, consumeUsage } from "./database";
import { buildVerifiedCart } from "./checkout";
import { printfulRequest } from "./printful";
import { HttpError } from "./http";
import {
  checkoutConfigured,
  stripeClient,
  INTEGRATION_ID,
  verifyTaxConfiguration,
} from "./stripe";
import {
  orderSnapshotSchema,
  quoteRequestSchema,
  type OrderSnapshot,
} from "../commerce-schema";
import { contribution } from "../margins";
import { hasDatabase } from "../env";
import {
  ownerFromMetadata,
  snapshotFromMetadata,
  snapshotMetadata,
} from "../order-snapshot-meta";
export interface OrderRecord {
  id: string;
  owner_hash: string;
  snapshot: OrderSnapshot;
  status: string;
  stripe_session_id: string | null;
  stripe_payment_id: string | null;
  printful_order_id: string | null;
}
const globalOrders = globalThis as unknown as {
  hdMemoryOrders?: Map<string, OrderRecord>;
};
function memoryOrders() {
  return (globalOrders.hdMemoryOrders ??= new Map());
}

function asRecord(row: {
  id: string;
  owner_hash: string;
  snapshot: unknown;
  status: string;
  stripe_session_id: string | null;
  stripe_payment_id: string | null;
  printful_order_id: string | number | null;
}): OrderRecord {
  return {
    id: row.id,
    owner_hash: row.owner_hash,
    snapshot: orderSnapshotSchema.parse(row.snapshot),
    status: row.status,
    stripe_session_id: row.stripe_session_id,
    stripe_payment_id: row.stripe_payment_id,
    printful_order_id:
      row.printful_order_id == null ? null : String(row.printful_order_id),
  };
}

export async function saveOrder(order: OrderRecord) {
  memoryOrders().set(order.id, order);
  if (!hasDatabase()) return;
  await database().query(
    `INSERT INTO hd_orders(id,owner_hash,snapshot,status,stripe_session_id,stripe_payment_id,printful_order_id)
     VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7)
     ON CONFLICT (id) DO UPDATE SET
       owner_hash=EXCLUDED.owner_hash,
       snapshot=EXCLUDED.snapshot,
       status=EXCLUDED.status,
       stripe_session_id=COALESCE(EXCLUDED.stripe_session_id, hd_orders.stripe_session_id),
       stripe_payment_id=COALESCE(EXCLUDED.stripe_payment_id, hd_orders.stripe_payment_id),
       printful_order_id=COALESCE(EXCLUDED.printful_order_id, hd_orders.printful_order_id),
       updated_at=now()`,
    [
      order.id,
      order.owner_hash,
      JSON.stringify(order.snapshot),
      order.status,
      order.stripe_session_id,
      order.stripe_payment_id,
      order.printful_order_id,
    ],
  );
}

export async function loadOrder(
  id: string,
  owner?: string,
): Promise<OrderRecord> {
  if (hasDatabase()) {
    const result = await database().query(
      "SELECT * FROM hd_orders WHERE id=$1" +
        (owner ? " AND owner_hash=$2" : ""),
      owner ? [id, owner] : [id],
    );
    const row = result.rows[0];
    if (!row) throw new HttpError(404, "Order not found in this browser.");
    const record = asRecord(row);
    memoryOrders().set(id, record);
    return record;
  }
  const row = memoryOrders().get(id);
  if (!row || (owner && row.owner_hash !== owner))
    throw new HttpError(404, "Order not found in this browser.");
  return row;
}

export async function recoverOrder(id: string, metadata: Record<string, string>) {
  try {
    return await loadOrder(id);
  } catch (error) {
    if (!(error instanceof HttpError) || error.status !== 404) throw error;
  }
  const snapshot = snapshotFromMetadata(metadata);
  if (!snapshot) throw new HttpError(404, "Order not found in this browser.");
  const record: OrderRecord = {
    id,
    owner_hash: ownerFromMetadata(metadata),
    snapshot,
    status: "checkout",
    stripe_session_id: null,
    stripe_payment_id: null,
    printful_order_id: null,
  };
  await saveOrder(record);
  return record;
}
const cost = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/)
  .transform((value) => {
    const [whole, fraction = ""] = value.split(".");
    return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  })
  .pipe(z.number().int().nonnegative().max(10_000_000));
const estimateSchema = z.object({
  result: z.object({
    costs: z.object({
      currency: z.literal("USD"),
      shipping: cost,
      total: cost,
    }),
  }),
});
export async function quoteOrder(input: unknown, owner: string) {
  if (!checkoutConfigured())
    throw new HttpError(
      503,
      "Online payment is not configured on this storefront. Your bag is saved.",
    );
  const { cart, recipient } = quoteRequestSchema.parse(input);
  if (hasDatabase()) {
    const window = new Date().toISOString().slice(0, 13);
    await consumeUsage([
      { bucket: "quote:global", window, limit: 100 },
      { bucket: `quote:${owner}`, window, limit: 8 },
    ]);
  }
  const tax = await verifyTaxConfiguration();
  const verified = await buildVerifiedCart(cart);
  if (verified.currency !== "USD")
    throw new HttpError(409, "These pieces cannot use this checkout currency.");
  const estimate = estimateSchema.parse(
    await printfulRequest("/orders/estimate-costs", {
      method: "POST",
      body: {
        recipient,
        shipping: "STANDARD",
        items: cart.items.map((i) => ({
          sync_variant_id: i.variantId,
          quantity: i.quantity,
        })),
        retail_costs: { currency: "USD" },
      },
    }),
  ).result.costs;
  const margin = contribution(
    verified.subtotalCents,
    estimate.total,
    estimate.shipping,
  );
  const floor = Number(process.env.MIN_CONTRIBUTION_RATE ?? "0.35");
  if (!Number.isFinite(floor) || floor < 0 || floor > 0.8)
    throw new HttpError(
      503,
      "Online payment is not configured on this storefront.",
    );
  if (margin.contributionRate < floor)
    throw new HttpError(
      409,
      "One or more pieces need a price update before checkout. Your bag is saved; please check back soon.",
    );
  const now = Date.now();
  const snapshot = orderSnapshotSchema.parse({
    ...verified,
    cart,
    recipient,
    shippingCents: estimate.shipping,
    fulfillmentCostCents: estimate.total,
    quoteExpires: now + 15 * 60000,
    stripeExpires: Math.floor(now / 1000) + 3600,
    taxMode: tax.mode,
    livemode: tax.live,
  });
  const id = randomUUID();
  await saveOrder({
    id,
    owner_hash: owner,
    snapshot,
    status: "quoted",
    stripe_session_id: null,
    stripe_payment_id: null,
    printful_order_id: null,
  });
  return {
    id,
    subtotalCents: snapshot.subtotalCents,
    shippingCents: snapshot.shippingCents,
    currency: snapshot.currency,
    expiresAt: snapshot.quoteExpires,
    lines: snapshot.lines.map(({ name, quantity, priceCents, variantId }) => ({
      name,
      quantity,
      priceCents,
      variantId,
    })),
  };
}
export async function createCheckout(id: string, owner: string) {
  if (!checkoutConfigured())
    throw new HttpError(
      503,
      "Online payment is not configured on this storefront. Your bag is saved.",
    );
  const order = await loadOrder(id, owner);
  const stripe = stripeClient();
  const snap = order.snapshot;
  if (["paid", "draft_created", "manual_review"].includes(order.status))
    throw new HttpError(
      409,
      "This order already has a payment. View its order status.",
    );
  if (order.stripe_session_id) {
    const session = await stripe.checkout.sessions.retrieve(
      order.stripe_session_id,
    );
    if (session.status === "open" && session.url) return { url: session.url };
    throw new HttpError(
      409,
      "This checkout is closed. Review your bag again before paying.",
    );
  }
  if (snap.quoteExpires <= Date.now())
    throw new HttpError(
      409,
      "Your quote expired. Refresh the delivery quote before paying.",
    );
  const tax = await verifyTaxConfiguration();
  if (tax.mode !== snap.taxMode || tax.live !== snap.livemode)
    throw new HttpError(409, "Checkout settings changed. Refresh your quote.");
  const address = {
    line1: snap.recipient.address1,
    line2: snap.recipient.address2 || "",
    city: snap.recipient.city,
    state: snap.recipient.state_code,
    postal_code: snap.recipient.zip,
    country: snap.recipient.country_code,
  };
  const shipping = { name: snap.recipient.name, address };
  // One customer per immutable order keeps the tax/delivery address fixed across concurrent checkouts.
  const customer = await stripe.customers.create(
    {
      name: snap.recipient.name,
      email: snap.recipient.email,
      shipping,
      address,
      metadata: { hd_order_id: id },
    },
    { idempotencyKey: `hd-customer-${id}` },
  );
  const origin = new URL(process.env.SITE_URL || "http://localhost:3000")
    .origin;
  const metadata = snapshotMetadata(id, owner, snap, {
    integration: INTEGRATION_ID,
  });
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      ui_mode: "hosted_page",
      integration_identifier: INTEGRATION_ID,
      customer: customer.id,
      client_reference_id: id,
      metadata,
      expires_at: snap.stripeExpires,
      success_url: `${origin}/orders/${id}`,
      cancel_url: `${origin}/checkout?cancelled=1`,
      automatic_tax: { enabled: snap.taxMode === "automatic" },
      line_items: snap.lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: "usd",
          unit_amount: line.priceCents,
          tax_behavior: "exclusive",
          product_data: {
            name: line.name,
            metadata: {
              hd_variant_id: String(line.variantId),
              hd_product_id: String(line.productId),
            },
          },
        },
      })),
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: snap.shippingCents, currency: "usd" },
            display_name: "Standard shipping",
            tax_behavior: "exclusive",
          },
        },
      ],
      payment_intent_data: {
        shipping,
        metadata: { hd_order_id: id, integration: INTEGRATION_ID },
      },
      custom_text: {
        submit: {
          message:
            "Delivery uses the address reviewed on Hustler Dior. Return to the store before paying if you need to change it.",
        },
      },
      // Dynamic payment methods. No client amounts, quantity changes, discount codes or silent add-ons.
    },
    { idempotencyKey: `hd-checkout-${id}` },
  );
  if (
    !session.url ||
    session.livemode !== snap.livemode ||
    new URL(session.url).origin !== "https://checkout.stripe.com"
  )
    throw new HttpError(502, "Checkout could not be opened.");
  await saveOrder({
    ...order,
    stripe_session_id: session.id,
    status: order.status === "quoted" ? "checkout" : order.status,
  });
  return { url: session.url };
}
