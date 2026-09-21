import {
  CheckoutParseError,
  parseCheckoutItems,
  parseRecipient,
} from "@/src/lib/checkout/parse";
import { PrintfulCheckoutError, PrintfulClient } from "@/src/lib/printful/client";
import { checkoutStatus, isCheckoutEnabled, shippingAmountCents } from "@/src/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const status = checkoutStatus();
  if (!isCheckoutEnabled()) {
    return Response.json({ error: status.message }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON with items and a recipient." }, { status: 400 });
  }

  try {
    const items = parseCheckoutItems(body);
    const recipient = parseRecipient(body);
    if (!recipient) {
      return Response.json(
        { error: "Add a US delivery address to quote shipping." },
        { status: 400 },
      );
    }
    const lines = await PrintfulClient.resolveCheckoutLines(items);
    const estimated = await PrintfulClient.estimateShipping(
      recipient,
      lines.map((line) => ({
        sync_variant_id: Number(line.variantId),
        quantity: line.quantity,
      })),
    );
    const shippingCents = estimated ?? shippingAmountCents();
    const subtotalCents = lines.reduce(
      (sum, line) => sum + line.unitAmountCents * line.quantity,
      0,
    );
    return Response.json({
      currency: lines[0]?.currency ?? "usd",
      subtotalCents,
      shippingCents,
      quoted: estimated != null,
    });
  } catch (error) {
    if (error instanceof CheckoutParseError || error instanceof PrintfulCheckoutError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Quote failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
