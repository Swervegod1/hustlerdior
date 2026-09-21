import type { PrintfulProduct, PrintfulVariant } from "@/src/lib/printful/types";

export const BAG_STORAGE_KEY = "hustler-dior-concrete-bag-v1";
export const MAX_BAG_LINES = 30;
export const MAX_BAG_QTY = 20;

export type BagLine = {
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  imageUrl: string | null;
  quantity: number;
  previewPrice: number;
  currency: string;
  mock?: boolean;
};

export function lineFromProduct(
  product: PrintfulProduct,
  variant: PrintfulVariant,
): BagLine {
  return {
    productId: product.id,
    variantId: variant.id,
    name: product.name,
    variantName: [variant.color, variant.size].filter(Boolean).join(" / ") || variant.name,
    imageUrl: variant.imageUrl || product.imageUrl,
    quantity: 1,
    previewPrice: variant.price,
    currency: variant.currency || product.currency || "USD",
    mock: product.mock,
  };
}

export function mergeLine(existing: BagLine[] | undefined, incoming: BagLine): BagLine[] {
  const lines = existing ? [...existing] : [];
  const index = lines.findIndex((line) => line.variantId === incoming.variantId);
  if (index >= 0) {
    const nextQty = Math.min(MAX_BAG_QTY, lines[index]!.quantity + incoming.quantity);
    lines[index] = { ...lines[index]!, quantity: nextQty, previewPrice: incoming.previewPrice };
    return lines;
  }
  if (lines.length >= MAX_BAG_LINES) return lines;
  if (lines.length && lines[0]!.currency !== incoming.currency) return lines;
  return [...lines, incoming];
}

export function bagCount(lines: BagLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function bagSubtotal(lines: BagLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity * line.previewPrice, 0);
}

export function readBag(): BagLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BAG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row): row is BagLine => {
        if (!row || typeof row !== "object") return false;
        const line = row as BagLine;
        return (
          typeof line.productId === "string" &&
          typeof line.variantId === "string" &&
          typeof line.name === "string" &&
          typeof line.quantity === "number" &&
          line.quantity >= 1
        );
      })
      .slice(0, MAX_BAG_LINES);
  } catch {
    return [];
  }
}

export function writeBag(lines: BagLine[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event("hustler-bag-changed"));
}
