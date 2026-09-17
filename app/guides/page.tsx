import type { Metadata } from "next";
import Link from "next/link";
import { createElement, Fragment } from "react";
import { GuideCatalog } from "@/src/lib/guides/content";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Streetwear guides from Hustler Dior / The Concrete Edit — positioning, brand story, bootleg graphics, indie brands, and made-to-order DTC.",
};

export default function GuidesIndexPage() {
  const guides = GuideCatalog.all();

  return createElement(
    Fragment,
    null,
    createElement(
      "section",
      { className: "page-hero" },
      createElement(
        "div",
        { className: "container" },
        createElement("h1", null, "Guides"),
        createElement(
          "p",
          null,
          "Concrete Edit field notes — independent streetwear, veteran-owned brand story, and made-to-order DTC.",
        ),
      ),
    ),
    createElement(
      "section",
      { className: "section" },
      createElement(
        "div",
        { className: "container" },
        createElement(
          "ul",
          { className: "guide-list", style: { listStyle: "none", display: "grid", gap: "1rem" } },
          ...guides.map((guide) =>
            createElement(
              "li",
              {
                key: guide.slug,
                style: {
                  border: "1px solid var(--line)",
                  background: "var(--bg-elevated)",
                  padding: "1.25rem 1.35rem",
                },
              },
              createElement(
                Link,
                {
                  href: `/guides/${guide.slug}`,
                  style: {
                    fontFamily: "var(--font-display)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    fontSize: "1.05rem",
                  },
                },
                guide.title,
              ),
              createElement(
                "p",
                {
                  style: {
                    color: "var(--muted)",
                    marginTop: "0.55rem",
                    fontSize: "0.9rem",
                    maxWidth: "62ch",
                  },
                },
                guide.description,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
