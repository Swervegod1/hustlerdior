import Stripe from "stripe";
import {
  CheckoutParseError,
  parseCheckoutItems,
  parseRecipient,
} from "@/src/lib/checkout/parse";
import { PrintfulCheckoutError, PrintfulClient } from "@/src/lib/printful/client";
import {
  checkoutAllowedCountries,
  checkoutStatus,
  isCheckoutEnabled,
  shippingAmountCents,
  siteOrigin,
  stripeClient,
} from "@/src/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(checkoutStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const status = checkoutStatus();
  if (!isCheckoutEnabled()) {
    return Response.json({ error: status.message }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON with an items array." }, { status: 400 });
  }

  try {
    const items = parseCheckoutItems(body);
    const recipient = parseRecipient(body);
    const lines = await PrintfulClient.resolveCheckoutLines(items);
    const stripe = stripeClient();
    const origin = siteOrigin(request);
    const countries = checkoutAllowedCountries();

    let shippingCents = shippingAmountCents();
    if (recipient) {
      const estimated = await PrintfulClient.estimateShipping(
        recipient,
        lines.map((line) => ({
          sync_variant_id: Number(line.variantId),
          quantity: line.quantity,
        })),
      );
      if (estimated != null) shippingCents = estimated;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/bag?cancelled=1`,
      customer_creation: "always",
      customer_email: recipient?.email,
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries:
          countries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection["allowed_countries"],
      },
      metadata: {
        items: JSON.stringify(
          lines.map((line) => ({
            p: line.productId,
            v: line.variantId,
            q: line.quantity,
          })),
        ),
      },
      line_items: lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: line.currency,
          unit_amount: line.unitAmountCents,
          product_data: {
            name: line.name,
            images: line.imageUrl ? [line.imageUrl] : undefined,
            metadata: {
              printful_product_id: line.productId,
              printful_variant_id: line.variantId,
            },
          },
        },
      })),
      ...(shippingCents != null
        ? {
            shipping_options: [
              {
                shipping_rate_data: {
                  type: "fixed_amount" as const,
                  display_name: shippingCents === 0 ? "Standard shipping (included)" : "Standard shipping",
                  fixed_amount: { amount: shippingCents, currency: "usd" },
                },
              },
            ],
          }
        : {}),
    });

    if (!session.url) {
      return Response.json({ error: "Stripe did not return a Checkout URL." }, { status: 502 });
    }

    return Response.json({ url: session.url, id: session.id });
  } catch (error) {
    if (error instanceof CheckoutParseError || error instanceof PrintfulCheckoutError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Checkout failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
