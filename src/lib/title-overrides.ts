import titles from "@/data/title-overrides.json";
import { productSlug } from "./slug";

export type TitleOverrideFile = {
  enabled: boolean;
  overrides: { productId: number; title: string }[];
};

/**
 * Checked-in display titles. `enabled: false` leaves the map empty so pages
 * use the Printful name and the slug stored for that name.
 */
export function titleOverrideMap(file: TitleOverrideFile) {
  const table = new Map<number, string>();
  if (file.enabled) {
    for (const row of file.overrides) table.set(row.productId, row.title);
  }
  return table;
}

const table = titleOverrideMap(titles);

export function titleOverridesEnabled() {
  return titles.enabled === true;
}

/** Display title for a listing, when one is checked in. */
export function titleOverrideFor(productId: number) {
  return table.get(productId);
}

/**
 * Slug for a catalog record.
 * An active override uses productSlug(title, id). Otherwise the stored
 * Printful slug is kept, so turning the file off serves the old URL again.
 */
export function catalogSlug(
  id: number,
  sourceName: string,
  storedSlug?: string,
) {
  return slugForTitle(id, sourceName, storedSlug, titleOverrideFor(id));
}

export function slugForTitle(
  id: number,
  sourceName: string,
  storedSlug: string | undefined,
  title: string | undefined,
) {
  if (!title) return storedSlug ?? productSlug(sourceName, id);
  return productSlug(title, id);
}
