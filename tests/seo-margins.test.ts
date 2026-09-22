import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isIndexable,
  serializeJsonLd,
  absoluteUrl,
  listingProductData,
  productData,
  publicHostFrom,
  robotsMetadata,
  xRobotsTag,
} from "../src/lib/seo";
import {
  contribution,
  recommendPrice,
  planningAssumptions,
} from "../src/lib/margins";
import { collections, collectionProducts } from "../src/lib/collections";
import type { Product } from "../src/lib/types";
import snapshot from "../src/data/catalog-snapshot.json" with { type: "json" };

test("the public storefront is indexable and staging hosts are not", () => {
  const primary = {
    SITE_URL: "https://hustlerdior.com",
    SITE_ROLE: "primary",
    SEARCH_INDEXING: "true",
  };
  const prelaunch = {
    SITE_URL: "https://hustlerdior.com",
    SITE_ROLE: "preview",
    SEARCH_INDEXING: "false",
    CATALOG_SNAPSHOT_PREVIEW: "true",
  };
  assert.equal(isIndexable(primary), true);
  assert.equal(isIndexable(prelaunch), true);
  assert.equal(
    isIndexable(
      {
        SITE_URL: "http://localhost:3000",
        SITE_ROLE: "preview",
        SEARCH_INDEXING: "false",
      },
      "hustlerdior.com",
    ),
    true,
  );
  assert.equal(isIndexable(prelaunch, "10.0.0.4"), true);
  assert.equal(isIndexable({}), false);
  assert.equal(isIndexable({ ...primary, SITE_ROLE: "backup" }), false);
  assert.equal(
    isIndexable({ ...primary, SITE_ROLE: "backup" }, "hustlerdior.com"),
    false,
  );
  assert.equal(
    isIndexable({ ...primary, SITE_URL: "https://preview.example.com" }),
    false,
  );
  assert.equal(isIndexable(primary, "preview.example.com"), false);
  assert.equal(
    isIndexable(
      {
        SITE_URL: "http://localhost:3000",
        SITE_ROLE: "preview",
        SEARCH_INDEXING: "false",
      },
      "localhost:3000",
    ),
    false,
  );
  assert.deepEqual(robotsMetadata(true), { index: true, follow: true });
  assert.equal(
    JSON.stringify(robotsMetadata(true)).includes("noarchive"),
    false,
  );
  for (const path of [
    "/",
    "/guides",
    "/guides/what-is-hustler-dior",
    "/guides/tactical-luxury-streetwear-positioning",
    "/guides/veteran-owned-streetwear-brand-story",
    "/guides/concrete-edit-90s-bootleg-graphic-tees",
    "/guides/how-to-wash-graphic-tees",
    "/help",
    "/fit-guide",
    "/about",
    "/collections/tees",
    "/products/skull-fx-graphic-tee-1",
    "/world",
    "/privacy",
  ]) {
    assert.equal(xRobotsTag(prelaunch, "hustlerdior.com", path), null, path);
  }
  assert.equal(
    xRobotsTag(prelaunch, "hustlerdior.com", "/checkout"),
    "noindex, nofollow",
  );
  assert.equal(
    xRobotsTag(prelaunch, "hustlerdior.com", "/curated"),
    "noindex, follow",
  );
  assert.equal(
    xRobotsTag(
      prelaunch,
      "hustlerdior.com",
      "/orders/11111111-1111-1111-1111-111111111111",
    ),
    "noindex, nofollow",
  );
  assert.equal(
    xRobotsTag(prelaunch, "preview.example.com", "/"),
    "noindex, nofollow, noarchive",
  );
  assert.equal(
    publicHostFrom({
      get: (name) =>
        name === "x-forwarded-host"
          ? "edge.example"
          : name === "host"
            ? "hustlerdior.com"
            : null,
    }),
    "hustlerdior.com",
  );
});

test("JSON-LD preserves merchant text while preventing closing-script injection", () => {
  const value = { name: '</script><script>alert("bad")</script> & <tee>' };
  const encoded = serializeJsonLd(value);
  assert.equal(encoded.includes("<"), false);
  assert.deepEqual(JSON.parse(encoded), value);
  assert.throws(() => absoluteUrl("//other.example.com"));
  assert.throws(() => absoluteUrl("https://other.example.com"));
});

function centsFromSchemaPrice(price: string) {
  assert.match(price, /^\d+\.\d{2}$/);
  return Math.round(Number(price) * 100);
}

test("product variants have exact deep links and catalog-backed offers", () => {
  const p = snapshot.products[0] as Product;
  assert.ok(p.variants.length > 1);
  const structured = productData(p);
  assert.equal(structured.name, p.name);
  assert.equal(structured.url, absoluteUrl(`/products/${p.slug}`));
  assert.equal(structured.brand.name, "Hustler Dior");
  assert.deepEqual(structured.image, p.image ? [p.image] : undefined);
  assert.equal(structured.hasVariant.length, p.variants.length);
  assert.equal(structured.offers?.["@type"], "AggregateOffer");
  if (structured.offers?.["@type"] !== "AggregateOffer") return;
  const prices = p.variants.map((variant) => variant.priceCents);
  assert.equal(
    centsFromSchemaPrice(structured.offers.lowPrice),
    Math.min(...prices),
  );
  assert.equal(
    centsFromSchemaPrice(structured.offers.highPrice),
    Math.max(...prices),
  );
  assert.equal(structured.offers.priceCurrency, p.currency);
  assert.equal(structured.offers.offerCount, p.variants.length);
  assert.ok(
    structured.hasVariant.every((variant, i) => {
      const source = p.variants[i];
      return (
        variant.url.endsWith(`?variant=${source.id}`) &&
        variant.name === source.name &&
        variant.brand.name === "Hustler Dior" &&
        variant.offers?.["@type"] === "Offer" &&
        variant.offers.priceCurrency === source.currency &&
        centsFromSchemaPrice(variant.offers.price) === source.priceCents &&
        (source.image
          ? variant.image?.[0] === source.image
          : variant.image === undefined)
      );
    }),
  );
  assert.equal(
    new Set(structured.hasVariant.map((v) => v.sku)).size,
    p.variants.length,
  );
  const listing = listingProductData(p);
  assert.equal(listing["@type"], "Product");
  assert.equal(listing.offers?.["@type"], "AggregateOffer");
  if (listing.offers?.["@type"] === "AggregateOffer") {
    assert.equal(
      centsFromSchemaPrice(listing.offers.lowPrice),
      Math.min(...prices),
    );
    assert.equal(listing.offers.priceCurrency, p.currency);
  }
});

test("offer availability follows catalog stock and never invents InStock", () => {
  const p = snapshot.products[0] as Product;
  const [first, second] = p.variants;
  assert.ok(first && second);
  const cases = [
    ["available", "https://schema.org/InStock"],
    ["out_of_stock", "https://schema.org/OutOfStock"],
    ["discontinued", "https://schema.org/OutOfStock"],
  ] as const;
  for (const [stock, availability] of cases) {
    const structured = productData({
      ...p,
      variants: [{ ...first, stock }],
    });
    assert.equal(structured.offers?.["@type"], "Offer");
    assert.equal(structured.offers?.availability, availability);
    assert.equal(structured.hasVariant[0].offers?.availability, availability);
    if (structured.offers?.["@type"] === "Offer") {
      assert.equal(
        centsFromSchemaPrice(structured.offers.price),
        first.priceCents,
      );
      assert.equal(structured.offers.priceCurrency, first.currency);
    }
  }
  const unknown = productData({
    ...p,
    image: null,
    variants: [{ ...first, stock: "unknown", image: null }],
  });
  assert.equal(unknown.image, undefined);
  assert.equal(unknown.hasVariant[0].image, undefined);
  assert.equal(unknown.offers?.availability, undefined);
  assert.equal(unknown.hasVariant[0].offers?.availability, undefined);
  assert.equal(JSON.stringify(unknown).includes("InStock"), false);
  assert.equal(JSON.stringify(unknown).includes("OutOfStock"), false);
  const mixed = productData({
    ...p,
    variants: [
      { ...first, stock: "out_of_stock" },
      { ...second, stock: "unknown" },
    ],
  });
  assert.equal(mixed.offers?.["@type"], "AggregateOffer");
  assert.equal(mixed.offers?.availability, undefined);
  assert.equal(
    mixed.hasVariant[0].offers?.availability,
    "https://schema.org/OutOfStock",
  );
  assert.equal(mixed.hasVariant[1].offers?.availability, undefined);
  assert.equal(JSON.stringify(mixed).includes("InStock"), false);
  const unsellable = productData({
    ...p,
    variants: [
      { ...first, priceCents: 0 },
      { ...second, currency: "usd" },
    ],
  });
  assert.equal(unsellable.offers, undefined);
  assert.equal(
    unsellable.hasVariant.every((variant) => variant.offers === undefined),
    true,
  );
  assert.equal(JSON.stringify(unsellable).includes("InStock"), false);
});

test("adult clothing collections exclude kids and non-clothing accessories", () => {
  const women = collections.find((c) => c.slug === "womens-streetwear")!;
  const rows = collectionProducts(women, snapshot.products as Product[]);
  assert.ok(rows.length > 0);
  assert.equal(rows[0].audience, "Women");
  assert.ok(
    rows.every(
      (p) =>
        ["Women", "Unisex"].includes(p.audience) &&
        ["Tees", "Layers", "Bottoms"].includes(p.category),
    ),
  );
});

test("actual sample identifies loss and prices a 35 percent contribution target", () => {
  const current = contribution(2875, 3543, 495);
  assert.equal(current.processingCents, 128);
  assert.equal(current.reserveCents, 87);
  assert.equal(current.contributionCents, -388);
  const proposed = recommendPrice(3543, 495);
  assert.equal(proposed.priceCents, 5599);
  assert.ok(proposed.contributionRate >= 0.35);
  assert.ok(recommendPrice(3543, 0).priceCents > proposed.priceCents);
  assert.ok(
    contribution(proposed.priceCents - 100, 3543, 495).contributionRate < 0.35,
  );
});

test("margin floors withstand rounding, invalid rates and size-cost changes", () => {
  for (const cost of [1, 999, 3543, 2953, 98765]) {
    const p = recommendPrice(cost, 0);
    assert.equal(p.priceCents % 100, 99);
    assert.ok(p.contributionRate >= planningAssumptions.targetContributionRate);
  }
  assert.ok(
    recommendPrice(2953, 495).priceCents > recommendPrice(2317, 495).priceCents,
  );
  assert.throws(() => recommendPrice(-1, 0));
  assert.throws(() => recommendPrice(10.1, 0));
  assert.throws(() =>
    recommendPrice(1000, 0, {
      ...planningAssumptions,
      targetContributionRate: 0.98,
    }),
  );
});
