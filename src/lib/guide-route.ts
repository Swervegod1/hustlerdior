export const GUIDE_SLUGS = [
  "what-is-hustler-dior",
  "tactical-luxury-streetwear-positioning",
  "veteran-owned-streetwear-brand-story",
  "concrete-edit-90s-bootleg-graphic-tees",
  "how-to-wash-graphic-tees",
  "garment-dyed-vs-pigment-dyed-streetwear-tees",
  "graphic-tee-color-combinations",
  "how-to-remove-lint-and-pilling-from-hoodies",
  "how-to-style-oversized-boxy-tees-with-baggy-pants",
] as const;

export type GuideSlug = (typeof GUIDE_SLUGS)[number];

const PUBLISHED_GUIDE_SLUGS = new Set<string>(GUIDE_SLUGS);

/** Short aliases that must not render as a soft 200 of the homepage. */
const GUIDE_ALIAS_REDIRECTS: Record<string, string> = {
  "hustler-dior": "/guides/what-is-hustler-dior",
};

export function guideSlugAction(
  pathname: string,
):
  | { kind: "pass" }
  | { kind: "redirect"; pathname: string }
  | { kind: "not-found" } {
  const match = pathname.match(/^\/guides\/([^/]+)\/?$/);
  if (!match) return { kind: "pass" };
  let raw: string;
  try {
    raw = decodeURIComponent(match[1]);
  } catch {
    return { kind: "not-found" };
  }
  const slug = raw.toLowerCase();
  if (PUBLISHED_GUIDE_SLUGS.has(slug)) {
    if (raw !== slug) return { kind: "redirect", pathname: `/guides/${slug}` };
    return { kind: "pass" };
  }
  const target = GUIDE_ALIAS_REDIRECTS[slug];
  if (target) return { kind: "redirect", pathname: target };
  return { kind: "not-found" };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** One robots meta, its own title, and no homepage description. */
export function unavailablePageHtml(link: { href: string; label: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Page not found | Hustler Dior</title>
</head>
<body>
<main>
<p>404 / OFF THE GRID</p>
<h1>This piece moved on.</h1>
<p><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></p>
</main>
</body>
</html>`;
}

export function unknownGuideHtml() {
  return unavailablePageHtml({ href: "/guides", label: "All guides" });
}
