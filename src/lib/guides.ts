import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter, type GuideFrontmatter } from "./guide-parse";

export type Guide = GuideFrontmatter & { body: string };

export const GUIDE_SLUGS = [
  "what-is-hustler-dior",
  "tactical-luxury-streetwear-positioning",
  "veteran-owned-streetwear-brand-story",
  "concrete-edit-90s-bootleg-graphic-tees",
] as const;

export type GuideSlug = (typeof GUIDE_SLUGS)[number];

const GUIDES_DIR = join(process.cwd(), "content", "guides");

function readGuideFile(slug: GuideSlug) {
  return readFileSync(join(GUIDES_DIR, `${slug}.mdx`), "utf8");
}

export function loadGuide(slug: string): Guide | null {
  if (!GUIDE_SLUGS.includes(slug as GuideSlug)) return null;
  const parsed = parseFrontmatter(readGuideFile(slug as GuideSlug));
  if (parsed.data.slug !== slug) {
    throw new Error(`Guide slug mismatch: ${slug} vs ${parsed.data.slug}`);
  }
  return { ...parsed.data, body: parsed.body };
}

export function loadGuides(): Guide[] {
  return GUIDE_SLUGS.map((slug) => {
    const guide = loadGuide(slug);
    if (!guide) throw new Error(`Missing guide ${slug}`);
    return guide;
  });
}
