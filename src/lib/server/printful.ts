import "server-only";
import { z } from "zod";
import { normalizeProduct, productListSchema } from "../normalize";
import type { CatalogPage, Product } from "../types";
import { printfulToken } from "../env";

export const CATALOG_TAG = "printful-catalog";
export class PrintfulError extends Error {
  constructor(public status: number) {
    super("Catalog service is unavailable");
  }
}

export async function printfulRequest(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown; fresh?: boolean } = {},
) {
  const token = printfulToken();
  const store = process.env.PRINTFUL_STORE_ID;
  if (!token || !store || !/^\d+$/.test(store)) throw new PrintfulError(503);
  // Never accept user-provided URLs, credentials or destination hosts.
  if (
    !/^\/(store\/products|store\/variants|v2\/catalog-|orders)(\/|\?|$)/.test(
      path,
    ) &&
    !path.startsWith("/v2/catalog-")
  )
    throw new Error("Unsupported Printful resource");
  const method = options.method ?? "GET";
  const response = await fetch(`https://api.printful.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "X-PF-Store-Id": store,
      "Content-Type": "application/json",
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    signal: AbortSignal.timeout(12000),
    ...(options.fresh || method !== "GET"
      ? { cache: "no-store" as const }
      : {
          cache: "force-cache" as const,
          next: { revalidate: 300, tags: [CATALOG_TAG] },
        }),
  });
  if (!response.ok) throw new PrintfulError(response.status);
  return response.json() as Promise<unknown>;
}

export async function getProduct(
  id: number,
  fresh = false,
): Promise<Product | null> {
  try {
    const envelope = z
      .object({ result: z.unknown() })
      .parse(await printfulRequest(`/store/products/${id}`, { fresh }));
    return normalizeProduct(envelope.result);
  } catch (error) {
    if (error instanceof PrintfulError && error.status === 404) return null;
    throw error;
  }
}

async function mapLimited<T, R>(
  values: T[],
  concurrency: number,
  fn: (value: T) => Promise<R>,
) {
  const results = new Array<R>(values.length);
  let index = 0;
  await Promise.all(
    Array.from({ length: Math.min(values.length, concurrency) }, async () => {
      while (index < values.length) {
        const i = index++;
        results[i] = await fn(values[i]);
      }
    }),
  );
  return results;
}

export async function getProducts(
  limit = 12,
  offset = 0,
): Promise<CatalogPage> {
  const data = productListSchema.parse(
    await printfulRequest(
      `/store/products?limit=${limit}&offset=${offset}&status=synced`,
    ),
  );
  const details = await mapLimited(data.result, 3, (p) => getProduct(p.id));
  return {
    products: details.filter((p): p is Product => p !== null),
    paging: {
      ...data.paging,
      nextOffset:
        data.paging.offset + data.result.length < data.paging.total &&
        data.result.length > 0
          ? data.paging.offset + data.result.length
          : null,
    },
    source: "printful",
    fetchedAt: new Date().toISOString(),
  };
}

const regionAvailability = z.object({
  data: z.union([
    z.object({
      techniques: z.array(
        z.object({
          selling_regions: z.array(
            z.object({ name: z.string(), availability: z.string() }),
          ),
        }),
      ),
    }),
    z.array(
      z.object({
        techniques: z.array(
          z.object({
            selling_regions: z.array(
              z.object({ name: z.string(), availability: z.string() }),
            ),
          }),
        ),
      }),
    ),
  ]),
});

export async function getLiveAvailability(
  catalogVariantId: number,
): Promise<boolean> {
  const region = process.env.PRINTFUL_SELLING_REGION || "usa";
  if (!/^[a-z_]+$/.test(region)) throw new Error("Invalid selling region");
  const response = regionAvailability.parse(
    await printfulRequest(
      `/v2/catalog-variants/${catalogVariantId}/availability?selling_region_name=${region}`,
      { fresh: true },
    ),
  );
  const records = Array.isArray(response.data)
    ? response.data
    : [response.data];
  // Conservative: every technique listed for the requested market must be in stock.
  // Before wider shipping, bind techniques and selling regions to the exact designs and destination.
  const states = records.flatMap((r) =>
    r.techniques.flatMap((t) =>
      t.selling_regions.filter(
        (s) => s.name === region || s.name === "worldwide",
      ),
    ),
  );
  return (
    states.length > 0 && states.every((s) => s.availability === "in stock")
  );
}
