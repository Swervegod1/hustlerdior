import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { checkoutSchema, recipientSchema } from "../checkout-schema";
import { buildVerifiedCart } from "./checkout";
import { printfulRequest, PrintfulError } from "./printful";

const capturedOrder = z.object({
  paymentId: z.string().min(1).max(200),
  provider: z.string().min(1).max(50),
  captured: z.literal(true),
  currency: z.string().regex(/^[A-Z]{3}$/),
  merchandiseTotalCents: z.number().int().positive(),
  recipient: recipientSchema,
  cart: checkoutSchema,
});
export interface PaymentVerifier {
  // Fetch receipt AND immutable order snapshot server-to-server, never from the request body.
  // Verify payment signature/status, amount, currency, order ownership and refunded state.
  loadCapturedOrder(paymentId: string): Promise<unknown>;
}
const printfulOrder = z.object({
  result: z.object({
    id: z.number().int().positive(),
    external_id: z.string(),
    status: z.string(),
  }),
});

/** Call only from a verified payment webhook / durable queue worker. Creates a draft; never auto-charges Printful. */
export async function createPrintfulDraft(
  paymentId: string,
  verifier: PaymentVerifier,
) {
  const paid = capturedOrder.parse(await verifier.loadCapturedOrder(paymentId));
  if (paid.paymentId !== paymentId) throw new Error("Payment mismatch");
  const externalId = `hd_${createHash("sha256").update(`${paid.provider}:${paymentId}`).digest("hex").slice(0, 28)}`;
  async function existingOrder() {
    try {
      return printfulOrder.parse(
        await printfulRequest(`/orders/@${externalId}`, { fresh: true }),
      ).result;
    } catch (error) {
      if (error instanceof PrintfulError && error.status === 404) return null;
      throw error;
    }
  }
  const existing = await existingOrder();
  if (existing)
    return { id: existing.id, status: existing.status, replay: true };
  const cart = await buildVerifiedCart(paid.cart);
  if (
    cart.currency !== paid.currency ||
    cart.subtotalCents !== paid.merchandiseTotalCents
  )
    throw new Error(
      "Paid order requires price reconciliation before fulfillment",
    );
  try {
    const order = printfulOrder.parse(
      await printfulRequest("/orders?confirm=false", {
        method: "POST",
        body: {
          external_id: externalId,
          shipping: "STANDARD",
          recipient: paid.recipient,
          items: cart.lines.map((l) => ({
            sync_variant_id: l.variantId,
            quantity: l.quantity,
            retail_price: (l.priceCents / 100).toFixed(2),
          })),
          retail_costs: {
            currency: cart.currency,
            subtotal: (cart.subtotalCents / 100).toFixed(2),
          },
        },
      }),
    ).result;
    return { id: order.id, status: order.status, replay: false };
  } catch (error) {
    // external_id is unique in the store; reconcile concurrent deliveries and lost responses.
    const duplicate = await existingOrder();
    if (duplicate)
      return { id: duplicate.id, status: duplicate.status, replay: true };
    throw error;
  }
}
