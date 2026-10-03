import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, type ReactNode } from "react";
import helpFaq from "../src/data/faq-help.json" with { type: "json" };
import fitGuideFaq from "../src/data/faq-fit-guide.json" with { type: "json" };
import { GUIDE_SLUGS, loadGuide, loadGuides } from "../src/lib/guides";
import { guideSlugAction, unknownGuideHtml } from "../src/lib/guide-route";
import { parseFrontmatter, siteRelativeHref } from "../src/lib/guide-parse";
import { guideFaqs, guideStructuredData } from "../src/lib/guide-schema";
import { markdownToReact } from "../src/lib/markdown";
import { absoluteUrl } from "../src/lib/seo";
import ReadingPage from "../src/components/ReadingPage";
import { generateMetadata as guideMetadata } from "../src/app/guides/[slug]/page";
import { metadata as guidesIndexMetadata } from "../src/app/guides/page";
import { metadata as notFoundMetadata } from "../src/app/not-found";

const EXPECTED = {
  "what-is-hustler-dior":
    "What Is Hustler Dior? Brand Guide to The Concrete Edit",
  "tactical-luxury-streetwear-positioning":
    "Tactical Luxury Streetwear Positioning: Where Hustler Dior Sits vs Utility & Hype Peers",
  "veteran-owned-streetwear-brand-story":
    "Veteran-Owned Streetwear Brand Story: Hustler Dior, Confirmed—Without the Rank Theater",
  "concrete-edit-90s-bootleg-graphic-tees":
    "The Concrete Edit: 90s Bootleg Energy for Graphic Tees (Taxonomy + Editorial)",
  "how-to-wash-graphic-tees":
    "How to Wash Graphic Streetwear Tees Without Cracking the Print",
  "garment-dyed-vs-pigment-dyed-streetwear-tees":
    "Garment-Dyed vs Pigment-Dyed Streetwear Tees: What the Soft Color Means",
  "graphic-tee-color-combinations":
    "Graphic Tee Color Combinations: Let One Color Lead",
  "how-to-remove-lint-and-pilling-from-hoodies":
    "How to Remove Lint and Pilling from Hoodies Without Damaging the Fabric",
  "how-to-style-oversized-boxy-tees-with-baggy-pants":
    "How to Style Oversized Boxy Tees With Baggy Pants",
  "heavyweight-hoodies-and-tees-explained":
    "Heavyweight Hoodies and Tees Explained: oz/yd², gsm, and What's Actually Stated",
} as const;

test("published guides parse from MDX with matching slugs and H1s", () => {
  const listed = readdirSync(join(process.cwd(), "content", "guides"))
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => name.replace(/\.mdx$/, ""))
    .sort();
  assert.deepEqual(listed, [...GUIDE_SLUGS].sort());
  const guides = loadGuides();
  assert.equal(guides.length, GUIDE_SLUGS.length);
  for (const slug of GUIDE_SLUGS) {
    const guide = loadGuide(slug);
    assert.ok(guide);
    assert.equal(guide.slug, slug);
    assert.equal(guide.h1, EXPECTED[slug]);
    assert.equal(guide.canonical, `https://hustlerdior.com/guides/${slug}`);
    assert.ok(guide.title);
    assert.ok(guide.description);
    assert.match(guide.body, /^[^#]/);
    assert.doesNotMatch(guide.body, /^# /m);
  }
});

test("guide markdown renders headings, internal links, and no extra H1", () => {
  const source = [
    "# Should be omitted",
    "",
    "Lead paragraph with a [tees](/collections/tees) link.",
    "",
    "## Direct answer",
    "",
    "Independent **DTC** with *bootleg* energy.",
    "",
    "- One",
    "- Two",
    "",
    "1. First",
    "2. Second",
  ].join("\n");
  const html = renderToStaticMarkup(
    createElement("div", null, markdownToReact(source)),
  );
  assert.equal(html.includes("<h1"), false);
  assert.match(html, /<h2>Direct answer<\/h2>/);
  assert.match(html, /href="\/collections\/tees"/);
  assert.match(html, /<strong>DTC<\/strong>/);
  assert.match(html, /<em>bootleg<\/em>/);
  assert.match(html, /<ul>/);
  assert.match(html, /<ol>/);
  const table = renderToStaticMarkup(
    createElement(
      "div",
      null,
      markdownToReact(
        [
          "| Blank | Weight |",
          "| --- | --- |",
          "| Stanley/Stella | [Dog Gone hoodie](https://hustlerdior.com/products/hustler-dior-dog-gone-unisex-sculpted-heavyweight-hoodie-475170849) |",
        ].join("\n"),
      ),
    ),
  );
  assert.match(table, /<th>Blank<\/th>/);
  assert.match(table, /<th>Weight<\/th>/);
  assert.match(
    table,
    /href="\/products\/hustler-dior-dog-gone-unisex-sculpted-heavyweight-hoodie-475170849"/,
  );
  assert.equal(table.includes("<h1"), false);
});

test("published guide bodies render a visible article without claiming live checkout", () => {
  for (const guide of loadGuides()) {
    const html = renderToStaticMarkup(
      createElement("article", null, markdownToReact(guide.body)),
    );
    assert.match(html, /<h2>/);
    assert.equal(html.includes("<h1"), false);
    assert.doesNotMatch(html, /checkout is live/i);
    assert.doesNotMatch(html, /payment works/i);
    assert.doesNotMatch(
      html,
      /\b(sergeant|lieutenant|captain|colonel|major)\b/i,
    );
    if (guide.slug === "heavyweight-hoodies-and-tees-explained") continue;
    assert.match(html, /Chase W\. Stemple/);
    assert.match(html, /Swerve God/);
  }
});

test("frontmatter parser and canonical helper stay site-relative", () => {
  const parsed = parseFrontmatter(
    readFileSync(
      join(process.cwd(), "content/guides/what-is-hustler-dior.mdx"),
      "utf8",
    ),
  );
  assert.equal(parsed.data.slug, "what-is-hustler-dior");
  assert.equal(siteRelativeHref("https://hustlerdior.com/about"), "/about");
  assert.equal(siteRelativeHref("/fit-guide"), "/fit-guide");
  assert.equal(
    [...GUIDE_SLUGS, "/guides"].every((path) =>
      absoluteUrl(path === "/guides" ? path : `/guides/${path}`).startsWith(
        "https://hustlerdior.com/guides",
      ),
    ),
    true,
  );
});

test("unknown guide slugs 404 and the short alias redirects", () => {
  assert.deepEqual(
    guideSlugAction("/guides/tactical-luxury-streetwear-positioning"),
    {
      kind: "pass",
    },
  );
  assert.deepEqual(guideSlugAction("/guides"), { kind: "pass" });
  assert.deepEqual(guideSlugAction("/guides/hustler-dior"), {
    kind: "redirect",
    pathname: "/guides/what-is-hustler-dior",
  });
  assert.deepEqual(guideSlugAction("/guides/not-a-real-guide"), {
    kind: "not-found",
  });
  const html = unknownGuideHtml();
  assert.match(html, /<title>Page not found \| Hustler Dior<\/title>/);
  assert.equal(html.includes("Independent Streetwear"), false);
  assert.match(html, /noindex, nofollow/);
});

test("wash guide is one indexable article with shop and help links", async () => {
  const guide = loadGuide("how-to-wash-graphic-tees");
  assert.ok(guide);
  assert.equal(
    guide.title,
    "How to Wash Graphic Tees Without Cracking the Print | Hustler Dior",
  );
  assert.doesNotMatch(
    guide.body,
    /Meta title|Meta description|Canonical \(when live\)/i,
  );
  assert.doesNotMatch(guide.body, /search volume|monthly searches/i);
  assert.doesNotMatch(guide.body, /^# /m);
  const html = renderToStaticMarkup(
    createElement(
      ReadingPage as (props: {
        title: string;
        name: string;
        path: string;
        intro: string;
        parent?: { name: string; path: string };
        children?: ReactNode;
      }) => ReactNode,
      {
        title: guide.h1,
        name: guide.title.split("|")[0].trim(),
        path: `/guides/${guide.slug}`,
        intro: guide.description,
        parent: { name: "Guides", path: "/guides" },
      },
      markdownToReact(guide.body),
    ),
  );
  assert.equal(html.match(/<h1[\s>]/g)?.length, 1);
  assert.match(
    html,
    /<h1>How to Wash Graphic Streetwear Tees Without Cracking the Print<\/h1>/,
  );
  assert.match(html, /href="\/collections\/tees"/);
  assert.match(html, /href="\/help"/);
  assert.match(html, /href="\/fit-guide"/);
  const meta = await guideMetadata({
    params: Promise.resolve({ slug: "how-to-wash-graphic-tees" }),
  });
  assert.deepEqual(meta.title, { absolute: guide.title });
  assert.equal(meta.description, guide.description);
  assert.equal(
    meta.alternates &&
      "canonical" in meta.alternates &&
      meta.alternates.canonical,
    absoluteUrl("/guides/how-to-wash-graphic-tees"),
  );
  assert.equal(meta.openGraph?.title, guide.title);
  assert.equal(
    meta.openGraph?.url,
    absoluteUrl("/guides/how-to-wash-graphic-tees"),
  );
});

test("new care and color guides are indexable articles with FAQ JSON-LD", async () => {
  const cases = [
    {
      slug: "garment-dyed-vs-pigment-dyed-streetwear-tees",
      title: "Garment-Dyed vs Pigment-Dyed Tees | Hustler Dior",
      sibling: "/guides/how-to-remove-lint-and-pilling-from-hoodies",
      faqs: 5,
    },
    {
      slug: "graphic-tee-color-combinations",
      title: "Graphic Tee Color Combinations That Work | Hustler Dior",
      sibling: null,
      faqs: 5,
    },
    {
      slug: "how-to-remove-lint-and-pilling-from-hoodies",
      title: "Remove Lint & Pilling From Hoodies Safely | Hustler Dior",
      sibling: "/guides/garment-dyed-vs-pigment-dyed-streetwear-tees",
      faqs: 5,
    },
    {
      slug: "how-to-style-oversized-boxy-tees-with-baggy-pants",
      title: "Style Oversized Boxy Tees With Baggy Pants | Hustler Dior",
      sibling: "/guides/graphic-tee-color-combinations",
      faqs: 7,
      comingSoon: true,
    },
  ] as const;
  for (const item of cases) {
    const guide = loadGuide(item.slug);
    assert.ok(guide);
    assert.equal(guide.title, item.title);
    assert.doesNotMatch(guide.title, /\| Hustler Dior \| Hustler Dior/);
    assert.doesNotMatch(
      guide.body,
      /Meta title|Meta description|Canonical \(when live\)|status:\s*draft|softCta/i,
    );
    assert.doesNotMatch(guide.body, /in-house|DTF manufacturing|wash-test/i);
    assert.doesNotMatch(guide.body, /^# /m);
    if (item.slug !== "graphic-tee-color-combinations") {
      assert.match(guide.body, /\/guides\/how-to-wash-graphic-tees/);
    }
    if (item.sibling) assert.match(guide.body, new RegExp(item.sibling));
    const html = renderToStaticMarkup(
      createElement("article", null, markdownToReact(guide.body)),
    );
    assert.equal(html.includes("<h1"), false);
    if (item.sibling && !("comingSoon" in item)) {
      assert.doesNotMatch(html, /coming soon/i);
    }
    const faqs = guideFaqs(guide.body);
    assert.equal(faqs.length, item.faqs);
    const structured = guideStructuredData(guide);
    const [article, faq] = structured["@graph"];
    assert.ok(article);
    assert.ok(faq);
    assert.equal(article["@type"], "Article");
    assert.equal(article.headline, guide.h1);
    assert.equal(faq["@type"], "FAQPage");
    assert.equal(faq.mainEntity?.length, item.faqs);
    assert.equal(JSON.stringify(structured).includes("Review"), false);
    const meta = await guideMetadata({
      params: Promise.resolve({ slug: item.slug }),
    });
    assert.deepEqual(meta.title, { absolute: guide.title });
    assert.equal(meta.description, guide.description);
  }
  const color = loadGuide("graphic-tee-color-combinations");
  assert.ok(color);
  assert.match(color.body, /coming soon/);
  assert.doesNotMatch(color.body, /rotation guide\]\(/i);
  assert.doesNotMatch(color.body, /washed and faded color tees\]\(/i);
  const styling = loadGuide(
    "how-to-style-oversized-boxy-tees-with-baggy-pants",
  );
  assert.ok(styling);
  assert.doesNotMatch(styling.body, /\/collections\/bottoms/);
  assert.match(styling.body, /coming soon/);
  assert.doesNotMatch(styling.body, /regular cuts\]\(/i);
  assert.match(styling.body, /\/guides\/how-to-wash-graphic-tees/);
  assert.match(
    styling.body,
    /\/guides\/garment-dyed-vs-pigment-dyed-streetwear-tees/,
  );
  assert.match(
    styling.body,
    /\/guides\/how-to-remove-lint-and-pilling-from-hoodies/,
  );
  assert.doesNotMatch(
    styling.body,
    /\b(gsm|cotton blend|in-house|DTF|wash-test)\b/i,
  );
});

test("heavyweight guide publishes stated Printful weights and visible FAQs", async () => {
  const guide = loadGuide("heavyweight-hoodies-and-tees-explained");
  assert.ok(guide);
  assert.equal(
    guide.title,
    "Heavyweight Hoodies and Tees Explained | Hustler Dior",
  );
  assert.equal(
    guide.description,
    "Fabric weight in oz/yd² and gsm, explained. See Printful's stated weights for Hustler Dior hoodies and tees, from 6 oz tees to a 500 gsm hoodie.",
  );
  assert.equal(
    guide.canonical,
    "https://hustlerdior.com/guides/heavyweight-hoodies-and-tees-explained",
  );
  assert.doesNotMatch(
    guide.body,
    /Meta title|Meta description|Canonical \(when live\)|status:\s*draft|softCta/i,
  );
  assert.doesNotMatch(guide.body, /^# /m);
  assert.doesNotMatch(
    guide.body,
    /no-shrink|600 gsm|loopback|French terry|DTF|pre-shrunk/i,
  );
  assert.doesNotMatch(guide.body, /La Lakers|476371270|la-lakers-hotplate/i);
  assert.match(guide.body, /Bella \+ Canvas 3010/);
  assert.match(
    guide.body,
    /hustler-dior-dog-gone-wildn-out-unisex-oversized-boxy-tee-475170199/,
  );
  const faqs = guideFaqs(guide.body);
  assert.equal(faqs.length, 7);
  assert.equal(faqs[0]?.question, "What does gsm mean on a hoodie or t-shirt?");
  assert.equal(
    faqs[6]?.question,
    "Are Hustler Dior hoodies and tees made in-house?",
  );
  assert.match(
    faqs[6]?.answer ?? "",
    /made to order through our fulfillment partner Printful/,
  );
  const structured = guideStructuredData(guide);
  const [article, faq] = structured["@graph"];
  assert.equal(article?.["@type"], "Article");
  assert.equal(article?.headline, guide.h1);
  assert.equal(faq?.["@type"], "FAQPage");
  assert.equal(faq?.mainEntity?.length, 7);
  const html = renderToStaticMarkup(
    createElement("article", null, markdownToReact(guide.body)),
  );
  assert.equal(html.includes("<h1"), false);
  assert.match(html, /<h2>FAQ<\/h2>/);
  assert.match(html, /15 oz\.\/yd\.² \(500 g\/m²\)/);
  assert.match(html, /6\.1 oz\/yd² \(206\.8 g\/m²\)/);
  assert.match(
    html,
    /href="\/products\/hustler-dior-dog-gone-unisex-sculpted-heavyweight-hoodie-475170849"/,
  );
  assert.match(html, /href="\/collections\/hoodies-layers"/);
  assert.match(html, /href="\/collections\/tees"/);
  const meta = await guideMetadata({
    params: Promise.resolve({
      slug: "heavyweight-hoodies-and-tees-explained",
    }),
  });
  assert.deepEqual(meta.title, { absolute: guide.title });
  assert.equal(meta.description, guide.description);
  assert.equal(
    meta.alternates?.canonical,
    absoluteUrl("/guides/heavyweight-hoodies-and-tees-explained"),
  );
});

test("root loading shell is not served ahead of the real H1", () => {
  assert.equal(existsSync(join(process.cwd(), "src/app/loading.tsx")), false);
});

test("guide index and missing-page titles name the topic once", () => {
  assert.equal(
    guidesIndexMetadata.title,
    "Streetwear Brand Guides: Tactical Luxury, Veteran-Owned, 90s Bootleg",
  );
  assert.match(String(guidesIndexMetadata.description), /Printful/);
  assert.doesNotMatch(
    String(guidesIndexMetadata.description),
    /in-house|DTF manufacturing|wash-test/i,
  );
  assert.equal(
    loadGuide("tactical-luxury-streetwear-positioning")?.title,
    "Tactical Luxury Streetwear Positioning | Hustler Dior",
  );
  assert.equal(notFoundMetadata.robots, null);
  assert.deepEqual(notFoundMetadata.title, {
    absolute: "Page not found | Hustler Dior",
  });
});

test("help and fit-guide FAQ drop-ins are FAQPage graphs", () => {
  assert.equal(helpFaq["@type"], "FAQPage");
  assert.equal(fitGuideFaq["@type"], "FAQPage");
  assert.equal(helpFaq.mainEntity.length, 7);
  assert.equal(fitGuideFaq.mainEntity.length, 4);
  assert.equal(helpFaq.mainEntity[0]?.name, "Is online checkout open?");
});
