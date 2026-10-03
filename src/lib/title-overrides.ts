import titles from "@/data/title-overrides.json";

const table = new Map<number, string>();
if (titles.enabled) {
  for (const row of titles.overrides) table.set(row.productId, row.title);
}

/** Display title for a Gildan 5000 listing, when one is checked in. */
export function titleOverrideFor(productId: number) {
  return table.get(productId);
}
