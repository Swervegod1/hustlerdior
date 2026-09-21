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

type RecipientDraft = {
  name: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state_code: string;
  zip: string;
};

const emptyRecipient: RecipientDraft = {
  name: "",
  email: "",
  address1: "",
  address2: "",
  city: "",
  state_code: "",
  zip: "",
};

function field(
  recipient: RecipientDraft,
  setRecipient: (next: RecipientDraft) => void,
  key: keyof RecipientDraft,
  label: string,
  extra: Record<string, string> = {},
) {
  return createElement(
    "label",
    { className: "pdp__variant" },
    createElement("span", null, label),
    createElement("input", {
      className: "bag__input",
      value: recipient[key],
      autoComplete: extra.autoComplete,
      onChange: (event: { target: { value: string } }) =>
        setRecipient({ ...recipient, [key]: event.target.value }),
    }),
  );
}

export default function BagView({
  checkoutConfigured,
  checkoutMessage,
  cancelled = false,
}: BagViewProps) {
  const { lines, setQuantity, remove, hydrated } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<{ shippingCents: number | null; quoted: boolean } | null>(
    null,
  );
  const [recipient, setRecipient] = useState<RecipientDraft>(emptyRecipient);
  const subtotal = bagSubtotal(lines);
  const currency = lines[0]?.currency || "USD";
  const hasMock = lines.some((line) => line.mock);

  function packedRecipient() {
    const filled = Object.entries(recipient).some(
      ([key, value]) => key !== "address2" && value.trim(),
    );
    if (!filled) return undefined;
    return { ...recipient, country_code: "US" };
  }

  function itemsPayload() {
    return lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
    }));
  }

  async function requestQuote() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsPayload(), recipient: packedRecipient() }),
      });
      const payload = (await response.json()) as {
        error?: string;
        shippingCents?: number | null;
        quoted?: boolean;
      };
      if (!response.ok) throw new Error(payload.error || "Could not quote delivery.");
      setQuote({
        shippingCents: payload.shippingCents ?? null,
        quoted: Boolean(payload.quoted),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not quote delivery.");
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsPayload(),
          recipient: packedRecipient(),
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
          "Mock drops cannot be paid for. Connect PRINTFUL_API_KEY or PRINTFUL_API_TOKEN to sell live inventory.",
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
    checkoutConfigured && !hasMock
      ? createElement(
          "div",
          { className: "bag__form" },
          createElement(
            "p",
            { className: "pdp__note" },
            "US delivery quote (optional). Stripe still collects the shipping address.",
          ),
          field(recipient, setRecipient, "name", "Name", { autoComplete: "name" }),
          field(recipient, setRecipient, "email", "Email", { autoComplete: "email" }),
          field(recipient, setRecipient, "address1", "Address", { autoComplete: "address-line1" }),
          field(recipient, setRecipient, "city", "City", { autoComplete: "address-level2" }),
          field(recipient, setRecipient, "state_code", "State (e.g. NY)", {
            autoComplete: "address-level1",
          }),
          field(recipient, setRecipient, "zip", "ZIP", { autoComplete: "postal-code" }),
          quote
            ? createElement(
                "p",
                { className: "pdp__note" },
                quote.shippingCents == null
                  ? "Shipping will be confirmed on Stripe."
                  : `Standard shipping ${formatMoney(quote.shippingCents / 100, currency)}${quote.quoted ? " (Printful quote)" : ""}.`,
              )
            : null,
          createElement(
            "button",
            {
              type: "button",
              className: "btn btn--ghost",
              onClick: requestQuote,
              disabled: busy,
            },
            busy ? "Quoting…" : "Get delivery quote",
          ),
        )
      : null,
    createElement(
      "p",
      { className: "pdp__note" },
      "Prices are confirmed server-side from Printful — the bag preview is not the charge.",
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
