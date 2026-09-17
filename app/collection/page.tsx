import type { Metadata } from "next";
import { createElement, Fragment } from "react";
import ProductCard from "@/components/ProductCard";
import { PrintfulClient } from "@/src/lib/printful/client";

export const metadata: Metadata = {
  title: "Collection",
  description: "Shop The Concrete Edit — Hustler Dior made-to-order drops.",
};

export default async function CollectionPage() {
  const catalog = await PrintfulClient.fetchCatalog();

  return createElement(
    Fragment,
    null,
    createElement(
      "section",
      { className: "page-hero" },
      createElement(
        "div",
        { className: "container" },
        createElement("h1", null, "Collection"),
        createElement(
          "p",
          null,
          "The Concrete Edit catalog. Graphic streetwear, made-to-order.",
          catalog.source === "mock"
            ? " Mock drops shown until Printful credentials are configured."
            : " Live from Printful.",
        ),
      ),
    ),
    createElement(
      "section",
      { className: "section" },
      createElement(
        "div",
        { className: "container" },
        catalog.message
          ? createElement(
              "p",
              {
                style: {
                  color: "var(--muted)",
                  fontSize: "0.8rem",
                  marginBottom: "1.25rem",
                },
              },
              catalog.message,
            )
          : null,
        catalog.products.length === 0
          ? createElement(
              "div",
              { className: "empty-state" },
              createElement("strong", null, "No products yet"),
              "Connect Printful or check mock fallback.",
            )
          : createElement(
              "div",
              { className: "product-grid" },
              ...catalog.products.map((product) =>
                createElement(ProductCard, { key: product.id, product }),
              ),
            ),
      ),
    ),
  );
}
