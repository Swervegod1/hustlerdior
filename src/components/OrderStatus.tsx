"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
const messages: Record<string, { title: string; text: string }> = {
  expired: {
    title: "THIS CHECKOUT EXPIRED.",
    text: "No completed payment was found for this checkout. Return to your bag for a new delivery quote.",
  },
  payment_failed: {
    title: "PAYMENT WASN’T COMPLETED.",
    text: "Your payment method did not complete this purchase. Return to your bag and review checkout again.",
  },
  quoted: {
    title: "YOUR ORDER IS WAITING.",
    text: "Payment has not been confirmed. You can return to your bag.",
  },
  checkout: {
    title: "CHECKING YOUR PAYMENT.",
    text: "We’re waiting for payment confirmation. This page updates automatically; a return from checkout alone does not confirm payment.",
  },
  paid: {
    title: "PAYMENT RECEIVED.",
    text: "Your payment is verified. We’re preparing the production handoff.",
  },
  draft_created: {
    title: "YOUR ORDER IS WITH US.",
    text: "Payment is verified and a production draft has been prepared. Your order is awaiting the store’s final fulfillment review.",
  },
  manual_review: {
    title: "WE’RE REVIEWING YOUR ORDER.",
    text: "This order needs an additional payment or fulfillment check. Keep your Stripe receipt and order reference.",
  },
};
export default function OrderStatus({ id }: { id: string }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let polls = 0;
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch(`/api/orders/${id}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Order status is unavailable.");
        setStatus(data.status);
        setError("");
        polls++;
        if (
          ![
            "draft_created",
            "manual_review",
            "expired",
            "payment_failed",
          ].includes(data.status) &&
          polls < 24
        )
          timer = setTimeout(refresh, 5000);
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Please refresh later.");
      }
    }
    void refresh();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [id]);
  const copy = messages[status];
  return (
    <article className="order-status" aria-live="polite">
      <h1>{copy?.title ?? "LOOKING UP YOUR ORDER."}</h1>
      <p>{error || copy?.text || "Checking this browser’s order reference…"}</p>
      <p className="order-reference">Order reference: {id}</p>
      <Link className="secondary-button" href="/">
        BACK TO THE COLLECTION ↗
      </Link>
    </article>
  );
}
