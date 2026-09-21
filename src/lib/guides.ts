import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter, type GuideFrontmatter } from "./guide-parse";

export type Guide = GuideFrontmatter & { body: string };

export const GUIDE_SLUGS = [
  "what-is-hustler-dior",
  "tactical-luxury-streetwear-positioning",
  "veteran-owned-streetwear-brand-story",
  "concrete-edit-90s-bootleg-graphic-tees",
] as const;

export type GuideSlug = (typeof GUIDE_SLUGS)[number];

function guidesDirectory() {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(process.cwd(), "content/guides"),
    join(process.cwd(), "../content/guides"),
    join(here, "../../content/guides"),
    join(here, "../../../content/guides"),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, `${GUIDE_SLUGS[0]}.mdx`))) return dir;
  }
  throw new Error("content/guides was not found");
}

function readGuideFile(slug: string) {
  return readFileSync(join(guidesDirectory(), `${slug}.mdx`), "utf8");
}

export function loadGuide(slug: string): Guide | null {
  if (!GUIDE_SLUGS.includes(slug as GuideSlug)) return null;
  const parsed = parseFrontmatter(readGuideFile(slug));
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

export function listedGuideFiles() {
  return readdirSync(guidesDirectory())
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => name.replace(/\.mdx$/, ""))
    .sort();
}
