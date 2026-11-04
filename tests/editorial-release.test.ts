import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Scarcity and paid offers are gated, never hardcoded", () => {
  const drop = read("src/components/DropCalendar.tsx");
  const sale = read("src/app/sale/page.tsx");
  assert.match(drop, /NEXT_PUBLIC_APPROVED_DROP_AT/);
  assert.match(drop, /hasApprovedDate/);
  assert.match(sale, /NO ACTIVE SALE ANNOUNCED/);
});
test("Product-card quick add retains fresh price and stock checks", () => {
  const card = read("src/components/ProductCard.tsx");
  assert.match(card, /fetch\(`\/api\/products\/\$\{product\.id\}/);
  assert.match(card, /variant\.stock !== "available"/);
  assert.match(card, /variant\.priceCents !== target\.priceCents/);
  assert.match(card, /selectedSize/);
});
test("Product details and menu have accessible controls", () => {
  assert.match(read("src/components/ProductOptions.tsx"), /mobile-sticky-atc/);
  assert.match(read("src/components/ProductOptions.tsx"), /aria-pressed/);
  assert.match(read("src/components/Navigation.tsx"), /<summary>RELEASES/);
});

test("Editorial heroes never automatically feature unreviewed artwork", () => {
  const home = read("src/app/page.tsx");
  assert.match(home, /APPROVED_EDITORIAL_FEATURE_PRODUCT_ID/);
  assert.match(home, /APPROVED_EDITORIAL_SECONDARY_PRODUCT_ID/);
  assert.doesNotMatch(home, /catalog\\?\\.products\\[0\\]/);
});
