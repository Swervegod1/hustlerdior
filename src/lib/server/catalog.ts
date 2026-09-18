import "server-only";
import { getProduct, getProducts, printfulRequest } from "./printful";
import type { CatalogPage, Product } from "../types";
import {
  audienceFor,
  categoryFor,
  productListSchema,
  productSlug,
} from "../normalize";
import { cache } from "react";

export async function initialCatalog(): Promise<CatalogPage | null> {
  if (process.env.CATALOG_SNAPSHOT_PREVIEW === "true") {
    const snapshot = (await import("@/data/catalog-snapshot.json")).default;
    return {
      products: snapshot.products as Product[],
      paging: {
        total: snapshot.products.length,
        limit: snapshot.products.length,
        offset: 0,
        nextOffset: null,
      },
      source: "snapshot",
      fetchedAt: snapshot.fetchedAt,
    };
  }
  try {
    return await getProducts(12, 0);
  } catch {
    return null;
  }
}
export const productForPage = cache(
  async (id: number): Promise<Product | null> => {
    if (process.env.CATALOG_SNAPSHOT_PREVIEW === "true") {
      const snapshot = (await import("@/data/catalog-snapshot.json")).default;
      return (snapshot.products as Product[]).find((p) => p.id === id) ?? null;
    }
    return getProduct(id);
  },
);

export type ProductIndexEntry = Pick<
  Product,
  "id" | "name" | "slug" | "category" | "audience"
>;

// Read the lightweight paginated index, not every product's variants, for sitemaps and collection filtering.
export const productIndex = cache(async (): Promise<ProductIndexEntry[]> => {
  if (process.env.CATALOG_SNAPSHOT_PREVIEW === "true") {
    const snapshot = (await import("@/data/catalog-snapshot.json")).default;
    return (snapshot.products as Product[]).map(
      ({ id, name, slug, category, audience }) => ({
        id,
        name,
        slug,
        category,
        audience,
      }),
    );
  }
  const products = new Map<number, ProductIndexEntry>();
  let offset = 0;
  while (true) {
    const page = productListSchema.parse(
      await printfulRequest(
        `/store/products?limit=100&offset=${offset}&status=synced`,
      ),
    );
    for (const p of page.result) {
      if (!p.is_ignored)
        products.set(p.id, {
          id: p.id,
          name: p.name,
          slug: productSlug(p.name, p.id),
          category: categoryFor(p.name),
          audience: audienceFor(p.name),
        });
    }
    offset += page.result.length;
    if (!page.result.length || offset >= page.paging.total) break;
  }
  return [...products.values()];
});

export async function productsForPage(ids: number[]) {
  const result: Product[] = [];
  for (let i = 0; i < ids.length; i += 3) {
    const batch = await Promise.all(ids.slice(i, i + 3).map(productForPage));
    result.push(...batch.filter((p): p is Product => p !== null));
  }
  return result;
}
