export type GuideFrontmatter = {
  title: string;
  description: string;
  slug: string;
  h1: string;
  canonical: string;
};

export type ParsedGuide = {
  data: GuideFrontmatter;
  body: string;
};

const REQUIRED_FIELDS = [
  "title",
  "description",
  "slug",
  "h1",
  "canonical",
] as const;

function unquote(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function parseFrontmatter(source: string): ParsedGuide {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("Guide is missing YAML frontmatter");
  const data: Partial<GuideFrontmatter> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const sep = trimmed.indexOf(":");
    if (sep === -1) continue;
    const key = trimmed.slice(0, sep).trim();
    const value = unquote(trimmed.slice(sep + 1).trim());
    if ((REQUIRED_FIELDS as readonly string[]).includes(key)) {
      data[key as (typeof REQUIRED_FIELDS)[number]] = value;
    }
  }
  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) throw new Error(`Guide is missing ${field}`);
  }
  return { data: data as GuideFrontmatter, body: match[2].trim() };
}

export function siteRelativeHref(href: string) {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const url = new URL(href);
    if (url.hostname === "hustlerdior.com" || url.hostname === "www.hustlerdior.com") {
      return `${url.pathname}${url.search}${url.hash}` || "/";
    }
  } catch {
    /* keep original href */
  }
  return href;
}
