/** Printful `/store/products` max page size. */
export const PRINTFUL_PAGE_LIMIT = 100;

/**
 * Loop-breaker only — not a merchandising cap.
 * 100 pages × 100 items covers stores far larger than the Concrete Edit catalog.
 */
export const PRINTFUL_SAFETY_MAX_OFFSET = 10_000;

export function reachedCatalogEnd(options: {
  pageLength: number;
  nextOffset: number;
  total?: number;
}): boolean {
  const { pageLength, nextOffset, total } = options;
  if (pageLength === 0) return true;
  if (pageLength < PRINTFUL_PAGE_LIMIT) return true;
  if (typeof total === "number" && nextOffset >= total) return true;
  if (nextOffset >= PRINTFUL_SAFETY_MAX_OFFSET) return true;
  return false;
}
