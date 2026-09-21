import type { Metadata } from "next";
import { createElement, Fragment } from "react";
import CollectionGrid from "@/components/CollectionGrid";
import { PrintfulClient } from "@/src/lib/printful/client";

export const metadata: Metadata = {
  title: "Collection",
  description: "Shop The Concrete Edit — Hustler Dior made-to-order drops.",
};

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const catalog = await PrintfulClient.fetchCatalog();

  const liveBlurb =
    catalog.source === "printful"
      ? ` Live Printful · ${catalog.products.length} drops.`
      : catalog.source === "mock"
        ? " Mock drops shown until Printful credentials are configured."
        : "";

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
          liveBlurb,
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
        createElement(CollectionGrid, { products: catalog.products }),
      ),
    ),
  );
}
