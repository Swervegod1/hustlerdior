import type { MetadataRoute } from "next";
import { productIndex } from "@/lib/server/catalog";
import { connection } from "next/server";
import { absoluteUrl, isIndexable } from "@/lib/seo";
import {
  collections,
  collectionProducts,
  COLLECTION_PAGE_SIZE,
} from "@/lib/collections";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  if (!isIndexable()) return [];
  const index = await productIndex();
  return [
    ...["/", "/about", "/world", "/fit-guide", "/help", "/privacy"].map(
      (path) => ({
        url: absoluteUrl(path),
      }),
    ),
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
    ...index.map((p) => ({ url: absoluteUrl(`/products/${p.slug}`) })),
  ];
}
