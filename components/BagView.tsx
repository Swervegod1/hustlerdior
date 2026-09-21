"use client";

import Link from "next/link";
import { createElement, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { bagSubtotal } from "@/src/lib/cart";
import { formatMoney } from "@/src/lib/money";

type BagViewProps = {
  checkoutConfigured: boolean;
  checkoutMessage: string;
  cancelled?: boolean;
};

export default function BagView({
  checkoutConfigured,
  checkoutMessage,
  cancelled = false,
}: BagViewProps) {
  const { lines, setQuantity, remove, hydrated } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subtotal = bagSubtotal(lines);
  const currency = lines[0]?.currency || "USD";
  const hasMock = lines.some((line) => line.mock);

  async function checkout() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
          })),
        }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Checkout could not start.");
      }
      window.location.assign(payload.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout could not start.");
      setBusy(false);
    }
  }

  if (!hydrated) {
    return createElement("p", { className: "pdp__note" }, "Loading bag…");
  }

  if (!lines.length) {
    return createElement(
      "div",
      { className: "empty-state" },
      createElement("strong", null, "Bag is empty"),
      "Add a sized drop from the collection.",
      createElement(
        "p",
        { style: { marginTop: "1rem" } },
        createElement(Link, { href: "/collection", className: "btn btn--ghost" }, "Shop the drop"),
      ),
    );
  }

  return createElement(
    "div",
    { className: "bag" },
    cancelled
      ? createElement(
          "p",
          { className: "banner" },
          "Checkout cancelled. Your bag is still here.",
        )
      : null,
    !checkoutConfigured
      ? createElement("p", { className: "banner banner--warn" }, checkoutMessage)
      : null,
    hasMock
      ? createElement(
          "p",
          { className: "banner banner--warn" },
          "Mock drops cannot be paid for. Connect PRINTFUL_API_KEY to sell live inventory.",
        )
      : null,
    createElement(
      "ul",
      { className: "bag__lines" },
      ...lines.map((line) =>
        createElement(
          "li",
          { key: line.variantId, className: "bag__line" },
          createElement(
            "div",
            { className: "bag__media" },
            line.imageUrl
              ? createElement("img", { src: line.imageUrl, alt: line.name })
              : createElement("span", { className: "product-card__placeholder" }, "Edit"),
          ),
          createElement(
            "div",
            null,
            createElement("h2", { className: "bag__name" }, line.name),
            createElement("p", { className: "pdp__note" }, line.variantName),
            createElement(
              "p",
              { className: "product-card__price" },
              formatMoney(line.previewPrice * line.quantity, line.currency),
            ),
            createElement(
              "div",
              { className: "bag__qty" },
              createElement(
                "button",
                {
                  type: "button",
                  "aria-label": `Decrease ${line.name}`,
                  onClick: () => setQuantity(line.variantId, Math.max(1, line.quantity - 1)),
                  disabled: line.quantity <= 1,
                },
                "−",
              ),
              createElement("span", null, String(line.quantity)),
              createElement(
                "button",
                {
                  type: "button",
                  "aria-label": `Increase ${line.name}`,
                  onClick: () => setQuantity(line.variantId, line.quantity + 1),
                  disabled: line.quantity >= 20,
                },
                "+",
              ),
              createElement(
                "button",
                {
                  type: "button",
                  className: "bag__remove",
                  onClick: () => remove(line.variantId),
                },
                "Remove",
              ),
            ),
          ),
        ),
      ),
    ),
    createElement(
      "div",
      { className: "bag__total" },
      createElement("span", null, "Subtotal"),
      createElement("strong", null, formatMoney(subtotal, currency)),
    ),
    createElement(
      "p",
      { className: "pdp__note" },
      "Shipping and tax are calculated on Stripe Checkout. Prices are confirmed server-side from Printful — the bag preview is not the charge.",
    ),
    error ? createElement("p", { className: "banner banner--warn" }, error) : null,
    createElement(
      "button",
      {
        type: "button",
        className: "btn btn--solid",
        onClick: checkout,
        disabled: busy || !checkoutConfigured || hasMock,
      },
      busy ? "Opening Stripe…" : checkoutConfigured ? "Pay with Stripe" : "Checkout unavailable",
    ),
    createElement(
      "p",
      { className: "pdp__note" },
      createElement(Link, { href: "/collection" }, "Continue shopping"),
    ),
  );
}
