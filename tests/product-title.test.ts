import { test } from "node:test";
import assert from "node:assert/strict";
import snapshot from "../src/data/catalog-snapshot.json" with { type: "json" };
import {
  catalogDocumentTitles,
  duplicateTitleCount,
  joinProductTitle,
  presentProductTitle,
} from "../src/lib/product-title";

const products = snapshot.products.map((product) => ({
  id: product.id,
  name: product.name,
}));

test("design and blank names join with a space", () => {
  assert.equal(
    joinProductTitle(
      "Hustler Dior: “Virginia Legends” — Oversized Tee",
      "Unisex organic oversized high neck t-shirt",
    ),
    "Hustler Dior: “Virginia Legends” — Oversized Tee Unisex organic oversized high neck t-shirt",
  );
  assert.equal(
    joinProductTitle("La Hotplated", "Unisex oversized boxy tee"),
    "La Hotplated Unisex oversized boxy tee",
  );
  assert.equal(
    joinProductTitle("Already spaced ", " Unisex tee"),
    "Already spaced Unisex tee",
  );
  assert.equal(
    presentProductTitle(
      "Hustler Dior: “Virginia Legends” — Oversized TeeUnisex organic oversized high neck t-shirt",
    ),
    "Hustler Dior: “Virginia Legends” — Oversized Tee",
  );
  assert.equal(
    presentProductTitle("La HotplatedUnisex oversized boxy tee"),
    "La Hotplated Unisex oversized boxy tee",
  );
});

test("snapshot product titles stay name-led and unique", () => {
  const before = duplicateTitleCount(products.map((product) => product.name));
  const titles = catalogDocumentTitles(products);
  const after = duplicateTitleCount(titles.values());
  assert.equal(before.groups, 3);
  assert.equal(before.products, 13);
  assert.equal(after.groups, 0);
  assert.equal(after.products, 0);
  assert.equal(titles.size, products.length);
  const heavy = [...titles.values()].filter((title) =>
    title.startsWith("Men's heavyweight tee"),
  );
  assert.equal(heavy.length, 8);
  assert.equal(new Set(heavy).size, 8);
  assert.equal(
    titles.get(471749182),
    "SwerveGang Purp Men's heavyweight tee",
  );
  assert.equal(
    titles.get(471749168),
    "Gunz-n-Roses Men's heavyweight tee",
  );
  assert.equal(titles.get(471749062)?.includes("TeeUnisex"), false);
  assert.match(String(titles.get(471749062)), /Virginia Legends/);
  for (const title of titles.values()) {
    assert.equal(title.endsWith("| Hustler Dior"), false);
    assert.doesNotMatch(title, /\| Hustler Dior \| Hustler Dior/);
  }
  assert.ok(String(titles.get(471749062)).length <= 70);
  for (const title of heavy) assert.ok(title.length <= 40, title);
});
