import { collections } from "./collections";
import { GUIDE_SLUGS } from "./guide-route";
import { CANONICAL_ORIGIN } from "./seo";

const COLLECTION_SLUGS = [
  "tees",
  "hoodies-layers",
  "mens-streetwear",
  "womens-streetwear",
] as const;

function link(path: string) {
  return new URL(path, CANONICAL_ORIGIN).href;
}

/** Short site description for answer engines. No garment specs. */
export function llmsText() {
  const published = new Set(collections.map((collection) => collection.slug));
  for (const slug of COLLECTION_SLUGS) {
    if (!published.has(slug)) {
      throw new Error(`llms.txt collection is not a real route: ${slug}`);
    }
  }
  const lines = [
    "# Hustler Dior",
    "",
    "Hustler Dior is an independent streetwear brand from Virginia Beach. Products are made to order and fulfilled by Printful.",
    "",
    "## Guides",
    link("/guides"),
    ...GUIDE_SLUGS.map((slug) => link(`/guides/${slug}`)),
    "",
    "## Fit and ordering",
    link("/fit-guide"),
    link("/help"),
    "",
    "## Collections",
    ...COLLECTION_SLUGS.map((slug) => link(`/collections/${slug}`)),
    "",
    "## Sitemap",
    link("/sitemap.xml"),
    "",
  ];
  return lines.join("\n");
}
