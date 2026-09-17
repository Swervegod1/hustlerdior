import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createElement, Fragment } from "react";
import { GuideCatalog } from "@/src/lib/guides/content";
import { GuideJsonLd } from "@/src/lib/guides/jsonLd";

type GuidePageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

export function generateStaticParams() {
  return GuideCatalog.slugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = GuideCatalog.bySlug(slug);
  if (!guide) {
    return { title: "Guide not found" };
  }
  return {
    title: guide.title,
    description: guide.description,
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = GuideCatalog.bySlug(slug);

  if (!guide) {
    notFound();
  }

  const jsonLd = GuideJsonLd.faqPage(guide.faqs);

  return createElement(
    Fragment,
    null,
    createElement("script", {
      type: "application/ld+json",
      dangerouslySetInnerHTML: { __html: JSON.stringify(jsonLd) },
    }),
    createElement(
      "section",
      { className: "page-hero" },
      createElement(
        "div",
        { className: "container" },
        createElement("h1", null, guide.title),
        createElement("p", null, guide.description),
      ),
    ),
    createElement(
      "section",
      { className: "section" },
      createElement(
        "div",
        { className: "container", style: { maxWidth: "720px" } },
        ...guide.sections.map((section) =>
          createElement(
            "article",
            {
              key: section.heading,
              style: { marginBottom: "2.25rem" },
            },
            createElement(
              "h2",
              {
                style: {
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "0.75rem",
                },
              },
              section.heading,
            ),
            createElement(
              "p",
              { style: { color: "var(--muted)", marginBottom: 0 } },
              section.body,
            ),
          ),
        ),
        createElement(
          "div",
          {
            style: {
              marginTop: "2.5rem",
              borderTop: "1px solid var(--line)",
              paddingTop: "2rem",
            },
          },
          createElement(
            "h2",
            {
              style: {
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "1rem",
              },
            },
            "FAQ",
          ),
          createElement(
            "dl",
            { style: { display: "grid", gap: "1.25rem" } },
            ...guide.faqs.flatMap((faq) => [
              createElement(
                "div",
                { key: faq.q },
                createElement(
                  "dt",
                  {
                    style: {
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                      marginBottom: "0.35rem",
                    },
                  },
                  faq.q,
                ),
                createElement(
                  "dd",
                  { style: { color: "var(--muted)", margin: 0 } },
                  faq.a,
                ),
              ),
            ]),
          ),
        ),
        createElement(
          "p",
          {
            style: {
              marginTop: "2.5rem",
              fontSize: "0.8rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--accent)",
            },
          },
          createElement(Link, { href: "/guides" }, "All guides"),
          " · ",
          createElement(Link, { href: "/collection" }, "Shop collection"),
        ),
      ),
    ),
  );
}
