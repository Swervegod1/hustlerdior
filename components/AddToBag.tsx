"use client";

import { createElement, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { lineFromProduct } from "@/src/lib/cart";
import { formatMoney } from "@/src/lib/money";
import type { PrintfulProduct } from "@/src/lib/printful/types";

type AddToBagProps = {
  product: PrintfulProduct;
  checkoutConfigured: boolean;
};

export default function AddToBag({ product, checkoutConfigured }: AddToBagProps) {
  const router = useRouter();
  const { add } = useCart();
  const variants = useMemo(
    () => (product.variants ?? []).filter((variant) => variant.price > 0 && variant.inStock),
    [product.variants],
  );
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);

  const selected = variants.find((variant) => variant.id === variantId) ?? variants[0];

  if (!variants.length) {
    return createElement(
      "div",
      null,
      createElement(
        "button",
        { type: "button", className: "btn btn--solid", disabled: true },
        "Unavailable",
      ),
      createElement(
        "p",
        { className: "pdp__note" },
        "No priced variants on this drop yet. Check Printful retail prices.",
      ),
    );
  }

  function onAdd() {
    if (!selected) return;
    const ok = add(lineFromProduct(product, selected));
    if (!ok) {
      setMessage("Could not add that style. Bag may be full or mixed-currency.");
      return;
    }
    setMessage("Added to bag.");
    router.push("/bag");
  }

  return createElement(
    "div",
    { className: "pdp__actions" },
    variants.length > 1
      ? createElement(
          "label",
          { className: "pdp__variant" },
          createElement("span", null, "Size / color"),
          createElement(
            "select",
            {
              value: selected?.id ?? "",
              onChange: (event: { target: { value: string } }) => {
                setVariantId(event.target.value);
                setMessage(null);
              },
            },
            ...variants.map((variant) =>
              createElement(
                "option",
                { key: variant.id, value: variant.id },
                `${[variant.color, variant.size].filter(Boolean).join(" / ") || variant.name} — ${formatMoney(variant.price, variant.currency)}`,
              ),
            ),
          ),
        )
      : createElement(
          "p",
          { className: "pdp__note" },
          selected
            ? `${selected.name} · ${formatMoney(selected.price, selected.currency)}`
            : null,
        ),
    createElement(
      "button",
      { type: "button", className: "btn btn--solid", onClick: onAdd },
      "Add to bag",
    ),
    !checkoutConfigured
      ? createElement(
          "p",
          { className: "banner banner--warn" },
          "Stripe is not configured on this host. You can still bag pieces; checkout stays off until STRIPE_SECRET_KEY is set.",
        )
      : null,
    product.mock
      ? createElement(
          "p",
          { className: "banner banner--warn" },
          "This is a mock drop. Live Printful products are required before Stripe will accept payment.",
        )
      : null,
    message ? createElement("p", { className: "pdp__note" }, message) : null,
  );
}
