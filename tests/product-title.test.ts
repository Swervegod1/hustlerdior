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
  const plainMens = [
    471749171, 471749172, 471749183, 471749186, 471749188, 471749191, 471749193,
    471749195,
  ];
  for (const id of plainMens)
    assert.equal(titles.get(id), `Men's heavyweight tee · ${id}`);
  assert.equal(titles.get(471749167), "YUM YUM DRIP Classic Tee");
  assert.equal(titles.get(471749169), "YUM YUM DRIP B&W Classic Tee");
  assert.equal(titles.get(471749182), "SwerveGang Purp Men's Classic Tee");
  assert.equal(titles.get(471749168), "Gunz-n-Roses Men's Classic Tee");
  assert.equal(titles.get(471749200), "No Menace Tee");
  assert.equal(titles.get(471749219), "Don't B A Menace Tees Classic Tee");
  for (const id of [
    471749167, 471749168, 471749169, 471749182, 471749200, 471749219,
  ])
    assert.doesNotMatch(String(titles.get(id)), /\bheavyweight\b/i);
  for (const id of plainMens)
    assert.match(String(titles.get(id)), /\bheavyweight\b/i);
  assert.equal(titles.get(471749062)?.includes("TeeUnisex"), false);
  assert.match(String(titles.get(471749062)), /Virginia Legends/);
  for (const title of titles.values()) {
    assert.equal(title.endsWith("| Hustler Dior"), false);
    assert.doesNotMatch(title, /\| Hustler Dior \| Hustler Dior/);
  }
  assert.ok(String(titles.get(471749062)).length <= 70);
  for (const id of plainMens) assert.ok(String(titles.get(id)).length <= 40);
});
