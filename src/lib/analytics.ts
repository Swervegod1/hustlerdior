/** GA4 measurement for the storefront. Events carry order references and amounts only. */

export const GA_MEASUREMENT_ID = "G-F05DW777H4";
export const PURCHASE_STORAGE_PREFIX = "hd_ga_purchase_";
const ITEM_BRAND = "Hustler Dior";
const MAX_CENTS = 10_000_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sentOrders = new Set<string>();

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export interface MeasurementItem {
  itemId: string;
  itemName: string;
  priceCents: number;
  quantity: number;
  itemCategory?: string;
  itemVariant?: string;
}

export interface PurchaseInput {
  id: string;
  status: string;
  subtotalCents: number;
  shippingCents: number;
  currency: string;
  items: MeasurementItem[];
}

export interface GaItem {
  item_id: string;
  item_name: string;
  item_brand: string;
  price: number;
  quantity: number;
  index: number;
  item_category?: string;
  item_variant?: string;
}

export interface PurchaseEvent {
  transaction_id: string;
  value: number;
  shipping: number;
  currency: string;
  items: GaItem[];
}

interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface AnalyticsDeps {
  gtag?: Gtag;
  storage?: KeyValueStore | null;
  sent?: Set<string>;
}

export function gaInitScript(measurementId = GA_MEASUREMENT_ID): string {
  if (!/^G-[A-Z0-9]+$/.test(measurementId))
    throw new Error("Invalid Google Analytics measurement id");
  return [
    "window.dataLayer = window.dataLayer || [];",
    "window.gtag = function gtag(){window.dataLayer.push(arguments);};",
    "window.gtag('js', new Date());",
    `window.gtag('config', '${measurementId}');`,
  ].join("\n");
}

export function gaLoaderSrc(measurementId = GA_MEASUREMENT_ID): string {
  if (!/^G-[A-Z0-9]+$/.test(measurementId))
    throw new Error("Invalid Google Analytics measurement id");
  return `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
}

/** Merchandise dollars. GA4 wants a decimal amount, not cents. */
export function centsToAmount(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

/** Payment is confirmed only after Stripe has been verified. */
export function isConfirmedPaidStatus(status: string): boolean {
  return status === "paid" || status === "draft_created";
}

export function purchaseStorageKey(orderId: string): string {
  return `${PURCHASE_STORAGE_PREFIX}${orderId}`;
}

export function publicOrderMeasurement(
  id: string,
  status: string,
  snapshot: {
    subtotalCents: number;
    shippingCents: number;
    currency: string;
    lines: Array<{
      variantId: number;
      name: string;
      priceCents: number;
      quantity: number;
    }>;
  },
) {
  return {
    id,
    status,
    subtotalCents: snapshot.subtotalCents,
    shippingCents: snapshot.shippingCents,
    currency: snapshot.currency,
    items: snapshot.lines.map((line) => ({
      itemId: String(line.variantId),
      itemName: line.name,
      priceCents: line.priceCents,
      quantity: line.quantity,
    })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readCents(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

/** Pick the public order fields. Extra properties, including any recipient data, are ignored. */
export function purchaseInputFromResponse(data: unknown): PurchaseInput | null {
  if (!isRecord(data) || !Array.isArray(data.items)) return null;
  if (typeof data.id !== "string" || typeof data.status !== "string")
    return null;
  if (typeof data.currency !== "string") return null;
  const subtotalCents = readCents(data.subtotalCents);
  const shippingCents = readCents(data.shippingCents);
  if (subtotalCents === null || shippingCents === null) return null;
  const items: MeasurementItem[] = [];
  for (const raw of data.items) {
    if (!isRecord(raw)) return null;
    const priceCents = readCents(raw.priceCents);
    const quantity = readCents(raw.quantity);
    if (typeof raw.itemId !== "string" || typeof raw.itemName !== "string")
      return null;
    if (priceCents === null || quantity === null) return null;
    items.push({
      itemId: raw.itemId,
      itemName: raw.itemName,
      priceCents,
      quantity,
    });
  }
  return {
    id: data.id,
    status: data.status,
    subtotalCents,
    shippingCents,
    currency: data.currency,
    items,
  };
}

function toGaItem(item: MeasurementItem, index: number): GaItem | null {
  if (!/^\d{1,15}$/.test(item.itemId)) return null;
  if (
    !Number.isInteger(item.priceCents) ||
    item.priceCents < 0 ||
    item.priceCents > MAX_CENTS
  )
    return null;
  if (
    !Number.isInteger(item.quantity) ||
    item.quantity < 1 ||
    item.quantity > 99
  )
    return null;
  const itemName = item.itemName.trim().slice(0, 100);
  if (!itemName) return null;
  const ga: GaItem = {
    item_id: item.itemId,
    item_name: itemName,
    item_brand: ITEM_BRAND,
    price: centsToAmount(item.priceCents),
    quantity: item.quantity,
    index,
  };
  const category = item.itemCategory?.trim().slice(0, 100);
  const variant = item.itemVariant?.trim().slice(0, 100);
  if (category) ga.item_category = category;
  if (variant) ga.item_variant = variant;
  return ga;
}

/**
 * `value` is merchandise only (sum of price × quantity). Shipping is separate.
 * Tax is omitted: Stripe Tax is not on the snapshot this browser can see.
 */
export function buildPurchaseEvent(order: PurchaseInput): PurchaseEvent | null {
  if (!isConfirmedPaidStatus(order.status)) return null;
  if (!UUID.test(order.id)) return null;
  if (!/^[A-Za-z]{3}$/.test(order.currency)) return null;
  if (
    !Number.isInteger(order.subtotalCents) ||
    order.subtotalCents < 0 ||
    order.subtotalCents > MAX_CENTS ||
    !Number.isInteger(order.shippingCents) ||
    order.shippingCents < 0 ||
    order.shippingCents > MAX_CENTS
  )
    return null;
  if (order.items.length < 1 || order.items.length > 30) return null;
  const items: GaItem[] = [];
  for (let index = 0; index < order.items.length; index++) {
    const item = toGaItem(order.items[index], index);
    if (!item) return null;
    items.push(item);
  }
  return {
    transaction_id: order.id,
    value: centsToAmount(order.subtotalCents),
    shipping: centsToAmount(order.shippingCents),
    currency: order.currency.toUpperCase(),
    items,
  };
}

function readGtag(): Gtag | undefined {
  if (typeof window === "undefined" || typeof window.gtag !== "function")
    return undefined;
  return window.gtag;
}

function browserStorage(): KeyValueStore | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

function readStored(storage: KeyValueStore | null, key: string): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeStored(storage: KeyValueStore | null, key: string) {
  if (!storage) return;
  try {
    storage.setItem(key, "1");
  } catch {
    // A blocked store must not break the page. GA still dedupes on transaction_id.
  }
}

export function trackPurchase(
  order: PurchaseInput,
  deps?: AnalyticsDeps,
): boolean {
  const event = buildPurchaseEvent(order);
  const gtag = deps?.gtag ?? readGtag();
  if (!event || typeof gtag !== "function") return false;
  const sent = deps?.sent ?? sentOrders;
  const storage = deps ? (deps.storage ?? null) : browserStorage();
  const key = purchaseStorageKey(order.id);
  if (sent.has(order.id) || readStored(storage, key)) {
    sent.add(order.id);
    return false;
  }
  sent.add(order.id);
  try {
    gtag("event", "purchase", event);
  } catch {
    sent.delete(order.id);
    return false;
  }
  writeStored(storage, key);
  return true;
}

function sendEvent(
  name: string,
  params: Record<string, unknown> | null,
  deps?: AnalyticsDeps,
): boolean {
  if (!params) return false;
  const gtag = deps?.gtag ?? readGtag();
  if (typeof gtag !== "function") return false;
  try {
    gtag("event", name, params);
    return true;
  } catch {
    return false;
  }
}

function merchandiseEvent(
  currency: string,
  subtotalCents: number,
  items: MeasurementItem[],
): { currency: string; value: number; items: GaItem[] } | null {
  if (!/^[A-Za-z]{3}$/.test(currency)) return null;
  if (
    !Number.isInteger(subtotalCents) ||
    subtotalCents < 0 ||
    subtotalCents > MAX_CENTS
  )
    return null;
  if (items.length < 1 || items.length > 30) return null;
  const gaItems: GaItem[] = [];
  for (let index = 0; index < items.length; index++) {
    const item = toGaItem(items[index], index);
    if (!item) return null;
    gaItems.push(item);
  }
  return {
    currency: currency.toUpperCase(),
    value: centsToAmount(subtotalCents),
    items: gaItems,
  };
}

export function trackViewItem(
  product: { name: string; category?: string },
  variant: {
    id: number;
    priceCents: number;
    currency: string;
    color: string;
    size: string;
  },
  deps?: AnalyticsDeps,
): boolean {
  return sendEvent(
    "view_item",
    merchandiseEvent(variant.currency, variant.priceCents, [
      {
        itemId: String(variant.id),
        itemName: product.name,
        priceCents: variant.priceCents,
        quantity: 1,
        itemCategory: product.category,
        itemVariant: `${variant.color} / ${variant.size}`,
      },
    ]),
    deps,
  );
}

export function trackAddToCart(
  product: { name: string; category?: string },
  variant: {
    id: number;
    priceCents: number;
    currency: string;
    color: string;
    size: string;
  },
  deps?: AnalyticsDeps,
): boolean {
  return sendEvent(
    "add_to_cart",
    merchandiseEvent(variant.currency, variant.priceCents, [
      {
        itemId: String(variant.id),
        itemName: product.name,
        priceCents: variant.priceCents,
        quantity: 1,
        itemCategory: product.category,
        itemVariant: `${variant.color} / ${variant.size}`,
      },
    ]),
    deps,
  );
}

export function trackBeginCheckout(
  quote: {
    currency: string;
    subtotalCents: number;
    items: MeasurementItem[];
  },
  deps?: AnalyticsDeps,
): boolean {
  return sendEvent(
    "begin_checkout",
    merchandiseEvent(quote.currency, quote.subtotalCents, quote.items),
    deps,
  );
}
