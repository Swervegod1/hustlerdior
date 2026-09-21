import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { absoluteUrl, isIndexable } from "@/lib/seo";
export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  // Leave backups crawlable so crawlers can observe noindex headers and metadata.
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    ...(isIndexable() ? { sitemap: absoluteUrl("/sitemap.xml") } : {}),
  };
}
