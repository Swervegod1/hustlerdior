import { shortName } from "./format";
import { titleOverrideFor } from "./title-overrides";

const GLUED_AUDIENCE = /([A-Za-z0-9])((?:Unisex|Men['’]s|Women['’]s)\b)/;

const GARMENT_NOUN =
  /\b(?:tees?|t-shirts?|shirts?|hoodies?|sweatshirts?|tanks?|jerseys?|pullovers?|crews?)\b/i;

/** Words that describe a blank, not a design. A tail made only of these can be dropped. */
const BLANK_WORDS = new Set([
  "unisex",
  "men",
  "mens",
  "men's",
  "men’s",
  "women",
  "womens",
  "women's",
  "women’s",
  "organic",
  "oversized",
  "high",
  "neck",
  "t-shirt",
  "t-shirts",
  "tee",
  "tees",
  "shirt",
  "shirts",
  "boxy",
  "garment-dyed",
  "garment",
  "dyed",
  "heavyweight",
  "lightweight",
  "cotton",
  "premium",
  "fleece",
  "pullover",
  "hoodie",
  "hoodies",
  "sweatshirt",
  "sweatshirts",
  "faded",
  "crew",
  "long",
  "sleeve",
  "sleeves",
  "raglan",
  "pocket",
  "classic",
  "softstyle",
  "tank",
  "top",
  "tops",
  "fitted",
  "crop",
  "cropped",
  "zip",
  "sports",
  "jersey",
  "print",
  "printed",
  "drop",
  "shoulder",
  "all-over",
  "up",
]);

const NAME_BUDGET = 70;

/** Page title, H1, and JSON-LD name. An override replaces the Printful name. */
export function displayTitle(id: number, name: string) {
  return titleOverrideFor(id) ?? name;
}

/** Card and rail label. Overrides stay intact; other names keep the short form. */
export function storefrontTitle(id: number, name: string) {
  return titleOverrideFor(id) ?? shortName(name);
}

export type TitledProduct = { id: number; name: string };

/**
 * Join a design name and a blank name. Alphanumeric edges get one space so
 * "Tee" + "Unisex …" cannot become "TeeUnisex".
 */
export function joinProductTitle(design: string, blank: string) {
  const left = design.trim();
  const right = blank.trim();
  if (!left) return right;
  if (!right) return left;
  return `${left} ${right}`.replace(/[ \t]{2,}/g, " ");
}

/** Repair a Printful name that concatenated a design onto a blank. */
export function repairProductTitle(name: string) {
  let current = name.trim();
  for (let guard = 0; guard < 4; guard += 1) {
    const match = current.match(GLUED_AUDIENCE);
    if (!match || match.index === undefined) break;
    const split = match.index + match[1].length;
    current = joinProductTitle(current.slice(0, split), current.slice(split));
  }
  return current;
}

function blankTail(words: string[]) {
  return (
    words.length > 0 &&
    words.every((word) => BLANK_WORDS.has(word.toLowerCase()))
  );
}

/**
 * Keep the design lead. Drop a trailing generic blank only when the lead
 * already names the garment and the full string is past a sensible length.
 * Never reduce a design-led name to the blank alone.
 */
export function presentProductTitle(name: string) {
  const repaired = repairProductTitle(name).replace(
    /\s+\|\s+Hustler Dior\s*$/i,
    "",
  );
  if (repaired.length <= NAME_BUDGET) return repaired;
  const words = repaired.split(/\s+/);
  for (let i = 1; i < words.length; i += 1) {
    const token = words[i].replace(/^[^A-Za-z0-9]+/, "");
    if (!/^(?:Unisex|Men['’]s|Women['’]s)$/i.test(token)) continue;
    const head = words.slice(0, i).join(" ");
    const tail = words.slice(i);
    const trimmed = head.replace(/[\s|–—-]+$/u, "").trim();
    if (!GARMENT_NOUN.test(trimmed) || !blankTail(tail)) continue;
    if (trimmed.length >= 12) return trimmed;
  }
  return repaired;
}

/** One document title per product. The layout template adds "| Hustler Dior". */
export function catalogDocumentTitles(products: TitledProduct[]) {
  const prepared = products.map((product) => ({
    id: product.id,
    title: titleOverrideFor(product.id) ?? presentProductTitle(product.name),
  }));
  const counts = new Map<string, number>();
  for (const product of prepared) {
    counts.set(product.title, (counts.get(product.title) ?? 0) + 1);
  }
  const titles = new Map<number, string>();
  for (const product of prepared) {
    const shared = (counts.get(product.title) ?? 0) > 1;
    titles.set(
      product.id,
      shared ? `${product.title} · ${product.id}` : product.title,
    );
  }
  return titles;
}

export function duplicateTitleCount(titles: Iterable<string>) {
  const counts = new Map<string, number>();
  for (const title of titles) counts.set(title, (counts.get(title) ?? 0) + 1);
  let groups = 0;
  let products = 0;
  for (const count of counts.values()) {
    if (count > 1) {
      groups += 1;
      products += count;
    }
  }
  return { groups, products };
}
