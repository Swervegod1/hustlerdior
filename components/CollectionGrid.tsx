"use client";

import { createElement, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { PrintfulProduct } from "@/src/lib/printful/types";

const PAGE_SIZE = 48;

export default function CollectionGrid({ products }: { products: PrintfulProduct[] }) {
  const [visible, setVisible] = useState(Math.min(PAGE_SIZE, products.length));
  const shown = useMemo(() => products.slice(0, visible), [products, visible]);
  const remaining = products.length - shown.length;

  if (!products.length) {
    return createElement(
      "div",
      { className: "empty-state" },
      createElement("strong", null, "No products yet"),
      "Connect Printful or check mock fallback.",
    );
  }

  return createElement(
    "div",
    null,
    createElement(
      "div",
      { className: "product-grid" },
      ...shown.map((product) => createElement(ProductCard, { key: product.id, product })),
    ),
    remaining > 0
      ? createElement(
          "div",
          { className: "bag", style: { marginTop: "1.75rem", justifyItems: "start" } },
          createElement(
            "button",
            {
              type: "button",
              className: "btn btn--ghost",
              onClick: () => setVisible((count) => Math.min(products.length, count + PAGE_SIZE)),
            },
            `Load more (${remaining} remaining)`,
          ),
        )
      : null,
  );
}
