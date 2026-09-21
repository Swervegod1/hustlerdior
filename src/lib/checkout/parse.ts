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

export const US_STATE_CODES =
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(
    " ",
  );

export type ShippingRecipient = {
  name: string;
  email: string;
  address1: string;
  address2?: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
};

function readString(value: unknown, label: string, min: number, max: number): string {
  if (typeof value !== "string") {
    throw new CheckoutParseError(`${label} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new CheckoutParseError(`${label} must be ${min}–${max} characters.`);
  }
  return trimmed;
}

export function parseRecipient(body: unknown): ShippingRecipient | undefined {
  if (!body || typeof body !== "object" || Array.isArray(body)) return undefined;
  const raw = (body as { recipient?: unknown }).recipient;
  if (raw == null) return undefined;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new CheckoutParseError("Delivery address is invalid.");
  }
  const row = raw as Record<string, unknown>;
  const email = readString(row.email, "Email", 3, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CheckoutParseError("Enter a valid email.");
  }
  const state_code = readString(row.state_code, "State", 2, 2).toUpperCase();
  if (!US_STATE_CODES.includes(state_code)) {
    throw new CheckoutParseError("Use a US state code.");
  }
  const zip = readString(row.zip, "ZIP", 5, 10);
  if (!/^\d{5}(-\d{4})?$/.test(zip)) {
    throw new CheckoutParseError("ZIP must be 12345 or 12345-6789.");
  }
  const country_code = readString(row.country_code ?? "US", "Country", 2, 2).toUpperCase();
  if (country_code !== "US") {
    throw new CheckoutParseError("This checkout currently ships to the US.");
  }
  const address2 =
    typeof row.address2 === "string" && row.address2.trim()
      ? readString(row.address2, "Address line 2", 1, 200)
      : undefined;
  return {
    name: readString(row.name, "Name", 2, 100),
    email,
    address1: readString(row.address1, "Address", 3, 200),
    address2,
    city: readString(row.city, "City", 1, 100),
    state_code,
    country_code,
    zip,
  };
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
