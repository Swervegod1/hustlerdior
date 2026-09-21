import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { checkoutSchema, recipientSchema } from "../src/lib/checkout-schema";
import {
  moneyToCents,
  normalizeProduct,
  safeImage,
} from "../src/lib/normalize";
import { verifyPrintfulSignature } from "../src/lib/webhook-signature";
import snapshot from "../src/data/catalog-snapshot.json";

const variant = {
  id: 5497864298,
  variant_id: 21000,
  name: "Test tee / Black / S",
  size: "S",
  color: "Black",
  synced: true,
  retail_price: "28.75",
  currency: "USD",
  availability_status: "active",
};
const product = {
  sync_product: {
    id: 471752024,
    name: "Test tee",
    thumbnail_url: "https://files.cdn.printful.com/test.png",
  },
  sync_variants: [variant],
};

test("prices use exact cents and reject malformed, negative and zero prices", () => {
  assert.equal(moneyToCents("28.75"), 2875);
  assert.equal(moneyToCents("19.9"), 1990);
  assert.equal(moneyToCents("17"), 1700);
  for (const input of [
    "0",
    "-1",
    "1e3",
    "1.234",
    "NaN",
    "",
    "99999999999999999999",
  ])
    assert.equal(moneyToCents(input), null);
});
test("normalization keeps sync variant IDs distinct from catalog variant IDs", () => {
  const parsed = normalizeProduct(product)!;
  assert.equal(parsed.variants[0].id, 5497864298);
  assert.equal(parsed.variants[0].catalogVariantId, 21000);
  assert.equal(parsed.priceCents, 2875);
});
test("ignored and unsynced variants cannot be sold", () => {
  assert.equal(
    normalizeProduct({
      ...product,
      sync_variants: [{ ...variant, synced: false }],
    }),
    null,
  );
  assert.equal(
    normalizeProduct({
      ...product,
      sync_product: { ...product.sync_product, is_ignored: true },
    }),
    null,
  );
});
test("out of stock and unknown upstream states are never marked available", () => {
  assert.equal(
    normalizeProduct({
      ...product,
      sync_variants: [
        { ...variant, availability_status: "temporary_out_of_stock" },
      ],
    })?.variants[0].stock,
    "out_of_stock",
  );
  assert.equal(
    normalizeProduct({
      ...product,
      sync_variants: [{ ...variant, availability_status: "new_unknown_state" }],
    })?.variants[0].stock,
    "unknown",
  );
});
test("upstream artwork and internal details are not exposed in normalized products", () => {
  const output = normalizeProduct({
    ...product,
    internal_secret: "hidden",
    sync_variants: [
      {
        ...variant,
        files: [
          {
            type: "front",
            preview_url: "https://files.cdn.printful.com/art.png",
            status: "ok",
            filename: "private.png",
          },
        ],
      },
    ],
  });
  assert.ok(!JSON.stringify(output).includes("private.png"));
  assert.ok(!JSON.stringify(output).includes("art.png"));
  assert.ok(!JSON.stringify(output).includes("hidden"));
});
test("image URLs are limited to trusted Printful hosts", () => {
  for (const url of [
    "javascript:alert(1)",
    "https://files.cdn.printful.com.evil.test/a",
    "https://localhost/a",
    "https://user:pass@files.cdn.printful.com/a",
  ])
    assert.equal(safeImage(url), null);
});
test("checkout rejects client pricing, fractional quantity, duplicates and excessive quantities", () => {
  const item = { productId: 1, variantId: 2, quantity: 1 };
  assert.ok(checkoutSchema.safeParse({ items: [item] }).success);
  for (const input of [
    { items: [{ ...item, priceCents: 1 }] },
    { items: [{ ...item, quantity: 1.5 }] },
    { items: [item, item] },
    { items: [{ ...item, quantity: 999 }] },
    { items: [], paid: true },
  ])
    assert.ok(!checkoutSchema.safeParse(input).success);
});
test("fulfillment address is restricted to the configured US launch region", () => {
  assert.ok(
    !recipientSchema.safeParse({
      name: "Test",
      email: "test@example.com",
      address1: "Test street",
      city: "City",
      state_code: "VA",
      country_code: "XX",
      zip: "23456",
    }).success,
  );
});
test("webhook HMAC uses the raw body and decodes the hex secret", () => {
  const body = Buffer.from('{ "type": "catalog_stock_updated" }');
  const secret = "a1".repeat(32);
  const signature = createHmac("sha256", Buffer.from(secret, "hex"))
    .update(body)
    .digest("hex");
  assert.ok(
    verifyPrintfulSignature(body, signature, "public", "public", secret),
  );
  assert.ok(
    !verifyPrintfulSignature(
      Buffer.from(JSON.stringify(JSON.parse(body.toString()))),
      signature,
      "public",
      "public",
      secret,
    ),
  );
  assert.ok(
    !verifyPrintfulSignature(body, signature, "attacker", "public", secret),
  );
  assert.ok(!verifyPrintfulSignature(body, "bad", "public", "public", secret));
});
test("all 100 imported products have unique variants, valid prices and explicit stock", () => {
  assert.equal(snapshot.products.length, 100);
  const ids = new Set<number>();
  for (const p of snapshot.products)
    for (const v of p.variants) {
      assert.ok(!ids.has(v.id));
      ids.add(v.id);
      assert.ok(Number.isSafeInteger(v.priceCents) && v.priceCents > 0);
      assert.ok(
        ["available", "out_of_stock", "discontinued", "unknown"].includes(
          v.stock,
        ),
      );
    }
  assert.equal(ids.size, 2444);
});
