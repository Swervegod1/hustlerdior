import type { Metadata } from "next";
import { createElement } from "react";
import BagView from "@/components/BagView";
import { checkoutStatus } from "@/src/lib/stripe";

export const metadata: Metadata = {
  title: "Bag",
  description: "Your Concrete Edit bag — pay with Stripe Checkout.",
};

export const dynamic = "force-dynamic";

type BagPageProps = {
  searchParams: Promise<{ cancelled?: string }>;
};

export default async function BagPage({ searchParams }: BagPageProps) {
  const params = await searchParams;
  const status = checkoutStatus();
  return createElement(
    "div",
    { className: "container section" },
    createElement("h1", { className: "section__title" }, "Bag"),
    createElement(BagView, {
      checkoutConfigured: status.configured,
      checkoutMessage: status.message,
      cancelled: params.cancelled === "1",
    }),
  );
}
