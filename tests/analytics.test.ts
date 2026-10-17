import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPurchaseEvent,
  centsToAmount,
  gaInitScript,
  gaLoaderSrc,
  GA_MEASUREMENT_ID,
  isConfirmedPaidStatus,
  publicOrderMeasurement,
  purchaseInputFromResponse,
  purchaseStorageKey,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackViewItem,
} from "../src/lib/analytics";

const orderId = "11111111-1111-4111-8111-111111111111";

function order(status = "paid") {
  return {
    id: orderId,
    status,
    subtotalCents: 9998,
    shippingCents: 599,
    currency: "USD",
    items: [
      {
        itemId: "5497864298",
        itemName: "Unisex organic oversized high neck t-shirt",
        priceCents: 2875,
        quantity: 2,
      },
      {
        itemId: "5497864301",
        itemName: "  Skull FX graphic tee  ",
        priceCents: 4248,
        quantity: 1,
      },
    ],
  };
}

function keysDeep(value: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const entry of value) keysDeep(entry, found);
    return found;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      found.add(key);
      keysDeep(entry, found);
    }
  }
  return found;
}

const blockedKeys = [
  "email",
  "name",
  "address",
  "address1",
  "address2",
  "phone",
  "recipient",
  "first_name",
  "last_name",
  "user_id",
  "user_data",
  "client_id",
];

test("cents become decimal amounts without adding a fraction of a cent", () => {
  assert.equal(centsToAmount(0), 0);
  assert.equal(centsToAmount(1), 0.01);
  assert.equal(centsToAmount(10), 0.1);
  assert.equal(centsToAmount(2875), 28.75);
  assert.equal(centsToAmount(9998), 99.98);
});

test("purchase value is merchandise only and items use the sync variant id", () => {
  const event = buildPurchaseEvent(order());
  assert.ok(event);
  assert.equal(event.transaction_id, orderId);
  assert.equal(event.value, 99.98);
  assert.equal(event.shipping, 5.99);
  assert.equal(event.currency, "USD");
  assert.equal(event.value, centsToAmount(2875 * 2 + 4248));
  assert.deepEqual(event.items, [
    {
      item_id: "5497864298",
      item_name: "Unisex organic oversized high neck t-shirt",
      item_brand: "Hustler Dior",
      price: 28.75,
      quantity: 2,
      index: 0,
    },
    {
      item_id: "5497864301",
      item_name: "Skull FX graphic tee",
      item_brand: "Hustler Dior",
      price: 42.48,
      quantity: 1,
      index: 1,
    },
  ]);
  for (const key of blockedKeys) assert.equal(keysDeep(event).has(key), false);
});

test("purchase is sent once for paid and draft_created, and not for other statuses", () => {
  for (const status of ["paid", "draft_created"])
    assert.equal(isConfirmedPaidStatus(status), true);
  for (const status of [
    "checkout",
    "quoted",
    "expired",
    "payment_failed",
    "manual_review",
    "",
  ]) {
    assert.equal(isConfirmedPaidStatus(status), false);
    assert.equal(buildPurchaseEvent(order(status)), null);
  }
  const calls: unknown[][] = [];
  const stored = new Map<string, string>();
  const storage = {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => {
      stored.set(key, value);
    },
  };
  const sent = new Set<string>();
  const gtag = (...args: unknown[]) => {
    calls.push(args);
  };
  assert.equal(
    trackPurchase(order("checkout"), { gtag, storage, sent }),
    false,
  );
  assert.equal(
    trackPurchase(order("manual_review"), { gtag, storage, sent }),
    false,
  );
  assert.equal(trackPurchase(order("paid"), { gtag, storage, sent }), true);
  assert.equal(
    trackPurchase(order("draft_created"), { gtag, storage, sent }),
    false,
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "event");
  assert.equal(calls[0][1], "purchase");
  assert.equal(stored.get(purchaseStorageKey(orderId)), "1");
  const reloaded = new Set<string>();
  assert.equal(
    trackPurchase(order("paid"), { gtag, storage, sent: reloaded }),
    false,
  );
  assert.equal(calls.length, 1);
});

test("a missing or throwing gtag does not mark the purchase sent", () => {
  const stored = new Map<string, string>();
  const storage = {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => {
      stored.set(key, value);
    },
  };
  const sent = new Set<string>();
  assert.equal(trackPurchase(order(), { storage, sent }), false);
  assert.equal(stored.size, 0);
  assert.equal(
    trackPurchase(order(), {
      gtag: () => {
        throw new Error("blocked");
      },
      storage,
      sent,
    }),
    false,
  );
  assert.equal(stored.size, 0);
  const calls: unknown[] = [];
  assert.equal(
    trackPurchase(order(), {
      gtag: (...args) => {
        calls.push(args);
      },
      storage,
      sent,
    }),
    true,
  );
  assert.equal(calls.length, 1);
});

test("the order payload ignores recipient fields", () => {
  const snapshot = {
    subtotalCents: 2875,
    shippingCents: 500,
    currency: "USD",
    lines: [
      {
        variantId: 5497864298,
        name: "Test tee",
        priceCents: 2875,
        quantity: 1,
      },
    ],
    recipient: {
      name: "Jane Doe",
      email: "buyer@example.com",
      address1: "1 Main St",
    },
  };
  const body = publicOrderMeasurement(orderId, "paid", snapshot);
  const encoded = JSON.stringify(body);
  assert.equal(encoded.includes("buyer@example.com"), false);
  assert.equal(encoded.includes("Jane Doe"), false);
  assert.equal(encoded.includes("1 Main St"), false);
  assert.equal(encoded.includes("recipient"), false);
  const parsed = purchaseInputFromResponse({
    ...body,
    email: "buyer@example.com",
    recipient: snapshot.recipient,
  });
  assert.ok(parsed);
  const event = buildPurchaseEvent(parsed);
  assert.ok(event);
  assert.equal(JSON.stringify(event).includes("buyer@example.com"), false);
  assert.equal(event.items[0].item_id, "5497864298");
});

test("the loader snippet configures the measurement id and exposes window.gtag", () => {
  const script = gaInitScript();
  assert.match(script, /window\.gtag = function gtag\(\)/);
  assert.match(script, /window\.gtag\('config', 'G-F05DW777H4'\)/);
  assert.equal(script.includes(GA_MEASUREMENT_ID), true);
  assert.equal(
    gaLoaderSrc(),
    `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`,
  );
  assert.throws(() => gaInitScript("not-an-id"));
});

test("view, bag, and checkout events use the same variant id and no customer fields", () => {
  const calls: unknown[][] = [];
  const gtag = (...args: unknown[]) => {
    calls.push(args);
  };
  const variant = {
    id: 5497864298,
    priceCents: 2875,
    currency: "usd",
    color: "Black",
    size: "S",
  };
  assert.equal(
    trackViewItem({ name: "Test tee", category: "Tees" }, variant, { gtag }),
    true,
  );
  assert.equal(
    trackAddToCart({ name: "Test tee", category: "Tees" }, variant, { gtag }),
    true,
  );
  assert.equal(
    trackBeginCheckout(
      {
        currency: "USD",
        subtotalCents: 5750,
        items: [
          {
            itemId: "5497864298",
            itemName: "Test tee",
            priceCents: 2875,
            quantity: 2,
          },
        ],
      },
      { gtag },
    ),
    true,
  );
  assert.deepEqual(
    calls.map((call) => call[1]),
    ["view_item", "add_to_cart", "begin_checkout"],
  );
  const view = calls[0][2] as {
    currency: string;
    value: number;
    items: Array<{ item_id: string; quantity: number; item_variant: string }>;
  };
  assert.equal(view.currency, "USD");
  assert.equal(view.value, 28.75);
  assert.equal(view.items[0].item_id, "5497864298");
  assert.equal(view.items[0].quantity, 1);
  assert.equal(view.items[0].item_variant, "Black / S");
  const checkout = calls[2][2] as {
    value: number;
    items: Array<{ quantity: number }>;
  };
  assert.equal(checkout.value, 57.5);
  assert.equal(checkout.items[0].quantity, 2);
  for (const call of calls)
    for (const key of blockedKeys)
      assert.equal(keysDeep(call[2]).has(key), false);
});
