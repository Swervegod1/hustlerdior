import test from "node:test";
import assert from "node:assert/strict";
import {
  addOnVariants,
  recommendationCandidates,
  selectedAddOn,
} from "../src/lib/merchandising";
import type { Product, ProductVariant } from "../src/lib/types";
const variant: ProductVariant = {
  id: 1,
  catalogVariantId: 101,
  name: "Cap",
  size: "One size",
  color: "Black",
  priceCents: 2400,
  currency: "USD",
  image: null,
  stock: "available",
};
const product: Product = {
  id: 10,
  name: "Cap",
  slug: "cap-10",
  image: null,
  category: "Accessories",
  audience: "Unisex",
  variants: [variant],
  priceCents: 2400,
  maxPriceCents: 2400,
  currency: "USD",
};
test("single available option can be added directly", () => {
  assert.equal(selectedAddOn(product, "USD")?.id, 1);
});
test("multiple sizes require an explicit matching selection", () => {
  const multi = {
    ...product,
    variants: [variant, { ...variant, id: 2, size: "L", priceCents: 2900 }],
  };
  assert.equal(selectedAddOn(multi, "USD"), null);
  assert.equal(selectedAddOn(multi, "USD", 2)?.priceCents, 2900);
  assert.equal(selectedAddOn(multi, "USD", 999), null);
});
test("unavailable, invalid-price, and mismatched-currency add-ons cannot enter a bag", () => {
  const invalid = {
    ...product,
    variants: [
      { ...variant, stock: "out_of_stock" as const },
      { ...variant, id: 2, priceCents: 0 },
      { ...variant, id: 3, currency: "EUR" },
    ],
  };
  assert.deepEqual(addOnVariants(invalid, "USD"), []);
  assert.equal(selectedAddOn(invalid, "USD", 1), null);
});

const recommendationIndex = [
  { id: 1, category: "Tees", audience: "Kids" },
  { id: 2, category: "Bottoms", audience: "Kids" },
  { id: 3, category: "Layers", audience: "Kids" },
  { id: 4, category: "Accessories", audience: "Unisex" },
  { id: 5, category: "Bottoms", audience: "Men" },
  { id: 6, category: "Layers", audience: "Women" },
  { id: 7, category: "Tees", audience: "Women" },
] satisfies Pick<Product, "id" | "category" | "audience">[];

test("kids-only bags receive kids sizes and never unspecified adult unisex pieces", () => {
  assert.deepEqual(recommendationCandidates(recommendationIndex, [1]), [2, 3]);
});
test("adult bags retain compatible fits without adding kids or opposite-gender sizes", () => {
  assert.deepEqual(recommendationCandidates(recommendationIndex, [7]), [4, 6]);
});
test("unknown products yield no suggestions, while a family bag can include both fits", () => {
  assert.deepEqual(recommendationCandidates(recommendationIndex, [999]), []);
  assert.deepEqual(
    recommendationCandidates(recommendationIndex, [1, 7]),
    [4, 2, 3, 6],
  );
});
