import type { CheckoutLineInput } from "@/src/lib/printful/types";

export const MAX_CHECKOUT_LINES = 30;
export const MAX_LINE_QUANTITY = 20;

export function parseCheckoutItems(body: unknown): CheckoutLineInput[] {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new CheckoutParseError("Send a JSON object with an items array.");
  }

  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new CheckoutParseError("Bag is empty.");
  }
  if (items.length > MAX_CHECKOUT_LINES) {
    throw new CheckoutParseError(`Bag is limited to ${MAX_CHECKOUT_LINES} styles.`);
  }

  const seen = new Set<string>();
  const parsed: CheckoutLineInput[] = [];

  for (const raw of items) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new CheckoutParseError("Each bag line needs productId, variantId, and quantity.");
    }
    const row = raw as Record<string, unknown>;
    const productId = String(row.productId ?? "").trim();
    const variantId = String(row.variantId ?? "").trim();
    const quantity = Number(row.quantity);

    if (!productId || !variantId) {
      throw new CheckoutParseError("Each bag line needs productId and variantId.");
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
      throw new CheckoutParseError(
        `Quantity must be a whole number from 1 to ${MAX_LINE_QUANTITY}.`,
      );
    }
    if (seen.has(variantId)) {
      throw new CheckoutParseError("Duplicate variants are not allowed. Combine quantities instead.");
    }
    seen.add(variantId);
    parsed.push({ productId, variantId, quantity });
  }

  return parsed;
}

export class CheckoutParseError extends Error {
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = "CheckoutParseError";
  }
}

export function dollarsToCents(amount: number): number {
  return Math.round(amount * 100);
}
