import type { MetadataRoute } from "next";
import { productIndex } from "@/lib/server/catalog";
import { connection } from "next/server";
import { requestPublicHost } from "@/lib/request-host";
import { absoluteUrl, isIndexable } from "@/lib/seo";
import { GUIDE_SLUGS } from "@/lib/guides";
import {
  collections,
  collectionProducts,
  COLLECTION_PAGE_SIZE,
} from "@/lib/collections";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  if (!isIndexable(process.env, await requestPublicHost())) return [];
  const index = await productIndex();
  return [
    ...[
      "/",
      "/about",
      "/world",
      "/fit-guide",
      "/help",
      "/privacy",
      "/guides",
    ].map((path) => ({
      url: absoluteUrl(path),
    })),
    ...collections.flatMap((collection) => {
      const pages = Math.max(
        1,
        Math.ceil(
          collectionProducts(collection, index).length / COLLECTION_PAGE_SIZE,
        ),
      );
      return Array.from({ length: pages }, (_, i) => ({
        url: absoluteUrl(
          `/collections/${collection.slug}${i ? `?page=${i + 1}` : ""}`,
        ),
      }));
    }),
    ...GUIDE_SLUGS.map((slug) => ({
      url: absoluteUrl(`/guides/${slug}`),
    })),
    ...index.map((p) => ({ url: absoluteUrl(`/products/${p.slug}`) })),
  ];
}
