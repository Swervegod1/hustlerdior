/**
 * Fail when a sitemap URL is noindex, has more than one robots meta,
 * or when /checkout or /curated are missing their intentional noindex
 * or appear in the sitemap.
 *
 * Usage: node scripts/check-sitemap-robots.mjs https://hustlerdior.com
 */
const INTENTIONAL = ["/checkout", "/curated"];

export function robotsMetaTags(html) {
  const tags = [];
  const re = /<meta\b[^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    const tag = match[0];
    const name = tag.match(/\bname\s*=\s*["']([^"']+)["']/i);
    if (name && name[1].toLowerCase() === "robots") tags.push(tag);
  }
  return tags;
}

export function metaContent(tag) {
  return tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1] ?? "";
}

export function hasDirective(value, directive) {
  return new RegExp(`(?:^|[,\\s])${directive}(?:$|[,\\s])`, "i").test(value);
}

export function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) =>
    match[1].trim(),
  );
}

export function pathnameOf(loc, base) {
  const url = new URL(loc, base);
  return url.pathname.replace(/\/$/, "") || "/";
}

function samePath(pathname, expected) {
  return pathname === expected || pathname.startsWith(`${expected}/`);
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current], current);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

export async function checkSitemapRobots(baseUrl) {
  const base = new URL(baseUrl);
  const failures = [];
  const sitemapUrl = new URL("/sitemap.xml", base);
  const sitemapResponse = await fetch(sitemapUrl, { redirect: "follow" });
  if (!sitemapResponse.ok) {
    return {
      failures: [`GET ${sitemapUrl} returned ${sitemapResponse.status}`],
      checked: 0,
    };
  }
  const locs = sitemapLocs(await sitemapResponse.text());
  if (!locs.length) {
    return { failures: ["sitemap.xml has no URLs"], checked: 0 };
  }
  const paths = locs.map((loc) => pathnameOf(loc, base));
  for (const path of INTENTIONAL) {
    if (paths.some((pathname) => samePath(pathname, path))) {
      failures.push(`${path} is in the sitemap`);
    }
  }

  async function inspect(pathname) {
    const url = new URL(pathname, base);
    const response = await fetch(url, { redirect: "manual" });
    const html = await response.text();
    return {
      pathname,
      status: response.status,
      location: response.headers.get("location") || "",
      xRobots: response.headers.get("x-robots-tag") || "",
      metas: robotsMetaTags(html),
      finalUrl: response.url,
    };
  }

  const pages = await mapPool(paths, 6, (pathname) => inspect(pathname));
  for (const page of pages) {
    const label = page.pathname;
    if (page.status !== 200) {
      failures.push(`${label} returned ${page.status}`);
      continue;
    }
    if (hasDirective(page.xRobots, "noindex")) {
      failures.push(`${label} x-robots-tag contains noindex (${page.xRobots})`);
    }
    if (page.metas.length > 1) {
      failures.push(
        `${label} has ${page.metas.length} robots metas: ${page.metas.join(" | ")}`,
      );
    }
    const content = page.metas.map(metaContent).join(" ");
    if (hasDirective(content, "noindex")) {
      failures.push(`${label} meta robots contains noindex (${content})`);
    }
  }

  for (const path of INTENTIONAL) {
    const page = await inspect(path);
    const content = page.metas.map(metaContent).join(" ");
    const combined = `${content} ${page.xRobots}`;
    if (page.status !== 200) {
      failures.push(`${path} returned ${page.status}`);
    }
    if (page.metas.length !== 1) {
      failures.push(`${path} has ${page.metas.length} robots metas`);
    }
    if (!hasDirective(combined, "noindex")) {
      failures.push(`${path} is not noindex`);
    }
    if (path === "/checkout" && !hasDirective(combined, "nofollow")) {
      failures.push("/checkout is missing nofollow");
    }
    if (path === "/curated" && hasDirective(combined, "nofollow")) {
      failures.push("/curated is nofollow; it should stay noindex, follow");
    }
    if (path === "/curated" && !hasDirective(content, "follow")) {
      failures.push("/curated meta robots is missing follow");
    }
  }

  return { failures, checked: pages.length };
}

const invoked = process.argv[1]?.endsWith("check-sitemap-robots.mjs");
if (invoked) {
  const baseUrl = process.argv[2] || process.env.SEO_BASE_URL;
  if (!baseUrl) {
    console.error(
      "Usage: node scripts/check-sitemap-robots.mjs <base-url>\nExample: node scripts/check-sitemap-robots.mjs https://hustlerdior.com",
    );
    process.exit(2);
  }
  checkSitemapRobots(baseUrl)
    .then(({ failures, checked }) => {
      if (failures.length) {
        for (const failure of failures) console.error(failure);
        process.exit(1);
      }
      console.log(
        `Checked ${checked} sitemap URLs plus /checkout and /curated against ${baseUrl}`,
      );
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
