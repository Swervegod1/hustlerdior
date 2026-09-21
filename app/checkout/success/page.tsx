import type { Metadata } from "next";
import Link from "next/link";
import { createElement } from "react";
import { stripeClient, isCheckoutEnabled } from "@/src/lib/stripe";

export const metadata: Metadata = {
  title: "Payment received",
  description: "Stripe Checkout completed for The Concrete Edit.",
};

export const dynamic = "force-dynamic";

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  let paid = false;
  let email: string | null = null;

  if (sessionId && isCheckoutEnabled()) {
    try {
      const session = await stripeClient().checkout.sessions.retrieve(sessionId);
      paid = session.payment_status === "paid";
      email = session.customer_details?.email ?? null;
    } catch {
      paid = false;
    }
  }

  return createElement(
    "div",
    { className: "container section" },
    createElement("h1", { className: "section__title" }, paid ? "You're in." : "Thanks — checking payment."),
    createElement(
      "p",
      { className: "page-hero p", style: { color: "var(--muted)", maxWidth: "48ch", marginBottom: "1.5rem" } },
      paid
        ? `Payment landed${email ? ` for ${email}` : ""}. Printful fulfillment starts from the Stripe webhook when STRIPE_WEBHOOK_SECRET is set on the host.`
        : "If you just paid, give Stripe a moment. Do not refresh into a new Checkout session. Check your email for the Stripe receipt.",
    ),
    createElement(Link, { href: "/collection", className: "btn btn--solid" }, "Back to collection"),
  );
}
