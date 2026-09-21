import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { requestPublicHost } from "@/lib/request-host";
import { absoluteUrl, isIndexable } from "@/lib/seo";
export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  // Leave backups crawlable so crawlers can observe noindex headers and metadata.
  const indexable = isIndexable(process.env, await requestPublicHost());
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    ...(indexable ? { sitemap: absoluteUrl("/sitemap.xml") } : {}),
  };
}
