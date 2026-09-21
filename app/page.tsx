import Link from "next/link";
import { createElement, Fragment } from "react";
import ProductCard from "@/components/ProductCard";
import { PrintfulClient } from "@/src/lib/printful/client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalog = await PrintfulClient.fetchCatalog();
  const featured = catalog.products.slice(0, 4);

  return createElement(
    Fragment,
    null,
    createElement(
      "section",
      { className: "hero" },
      createElement(
        "div",
        { className: "container" },
        createElement("p", { className: "hero__eyebrow" }, "Independent graphic streetwear"),
        createElement(
          "h1",
          { className: "hero__title" },
          "The Concrete ",
          createElement("span", null, "Edit"),
        ),
        createElement("p", { className: "hero__tagline" }, "Wear your own rules."),
        createElement(
          "div",
          { className: "hero__actions" },
          createElement(Link, { href: "/collection", className: "btn btn--solid" }, "Shop the drop"),
          createElement("a", { href: "#manifesto", className: "btn btn--ghost" }, "Read the manifesto"),
        ),
      ),
    ),
    createElement(
      "div",
      { className: "strip", "aria-label": "Brand pillars" },
      createElement(
        "div",
        { className: "strip__item" },
        createElement("strong", null, "Made to order"),
        "Printed when you buy — no dead stock",
      ),
      createElement(
        "div",
        { className: "strip__item" },
        createElement("strong", null, "Printful fulfillment"),
        "Global print-on-demand, ship-ready",
      ),
      createElement(
        "div",
        { className: "strip__item" },
        createElement("strong", null, "Swerve God"),
        "Creative direction from the concrete",
      ),
    ),
    createElement(
      "section",
      { className: "section" },
      createElement(
        "div",
        { className: "container" },
        createElement(
          "div",
          { className: "section__head" },
          createElement("h2", { className: "section__title" }, "Featured drops"),
          createElement(Link, { href: "/collection", className: "section__link" }, "Full collection →"),
        ),
        catalog.message
          ? createElement(
              "p",
              {
                style: {
                  color: "var(--muted)",
                  fontSize: "0.8rem",
                  marginBottom: "1.25rem",
                  letterSpacing: "0.04em",
                },
              },
              catalog.message,
            )
          : null,
        createElement(
          "div",
          { className: "product-grid" },
          ...featured.map((product) =>
            createElement(ProductCard, { key: product.id, product }),
          ),
        ),
      ),
    ),
    createElement(
      "section",
      { className: "manifesto", id: "manifesto" },
      createElement(
        "div",
        { className: "container manifesto__grid" },
        createElement("h2", null, "Built for the block, not the boardroom."),
        createElement(
          "div",
          null,
          createElement(
            "p",
            null,
            "Hustler Dior is independent graphic streetwear — The Concrete Edit. No seasonal filler. No corporate polish. Just marks that hold up under city light.",
          ),
          createElement(
            "p",
            null,
            "Every piece is made-to-order through Printful. You order. We print. It ships. Wear your own rules.",
          ),
          createElement(
            "p",
            null,
            "Creative direction by Swerve God. Hosted on Hostinger. Owned by the culture that built it.",
          ),
        ),
      ),
    ),
  );
}
