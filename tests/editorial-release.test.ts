import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

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
  assert.match(card, /product\.variants\.length !== 1/);
});
test("Product details and menu have accessible controls", () => {
  assert.match(read("src/components/ProductOptions.tsx"), /mobile-sticky-atc/);
  assert.match(read("src/components/ProductOptions.tsx"), /aria-pressed/);
  assert.match(
    read("src/components/Navigation.tsx"),
    /<summary aria-label="Shop categories"/,
  );
});

test("Editorial heroes never automatically feature unreviewed artwork", () => {
  const home = read("src/app/page.tsx");
  assert.match(home, /chrome-lockup.webp/);
  assert.doesNotMatch(home, /catalog\?\.products\[0\]/);
});
