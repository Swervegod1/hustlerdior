import type { Category, Product, ProductVariant } from "./types";

type IndexedPiece = Pick<Product, "id" | "category" | "audience">;

export function recommendationCandidates(index: IndexedPiece[], ids: number[]) {
  const selected = index.filter((piece) => ids.includes(piece.id));
  if (!selected.length) return [];
  const audiences = new Set(selected.map((piece) => piece.audience));
  const hasAdults = selected.some((piece) => piece.audience !== "Kids");
  const hasTop = selected.some(
    (piece) => piece.category === "Tees" || piece.category === "Layers",
  );
  const priorities: Category[] = hasTop
    ? ["Accessories", "Bottoms", "Layers", "Tees"]
    : ["Tees", "Layers", "Accessories", "Bottoms"];
  return priorities
    .flatMap((category) =>
      index
        .filter((piece) => {
          if (piece.category !== category || ids.includes(piece.id))
            return false;
          if (piece.audience === "Kids") return audiences.has("Kids");
          return (
            hasAdults &&
            (piece.audience === "Unisex" ||
              audiences.has("Unisex") ||
              audiences.has(piece.audience))
          );
        })
        .slice(0, 2),
    )
    .slice(0, 6)
    .map((piece) => piece.id);
}

export function addOnVariants(
  product: Product,
  currency: string,
): ProductVariant[] {
  return product.variants.filter(
    (variant) =>
      variant.stock === "available" &&
      variant.currency === currency &&
      Number.isSafeInteger(variant.priceCents) &&
      variant.priceCents > 0,
  );
}

export function selectedAddOn(
  product: Product,
  currency: string,
  variantId?: number,
) {
  const variants = addOnVariants(product, currency);
  if (variantId !== undefined)
    return variants.find((variant) => variant.id === variantId) ?? null;
  // Never silently choose a customer's size or color on a multi-variant item.
  return variants.length === 1 ? variants[0] : null;
}
