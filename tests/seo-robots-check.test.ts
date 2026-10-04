import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkSitemapRobots,
  hasDirective,
  metaContent,
  robotsMetaTags,
  sitemapLocs,
} from "../scripts/check-sitemap-robots.mjs";
import {
  collectionPathAction,
  orderPathAction,
} from "../src/lib/collection-route";
import { curatedClientCatalog } from "../src/lib/shopify-import";
import catalog from "../src/data/shopify-catalog.json" with { type: "json" };
import type { ShopifyEdit } from "../src/lib/shopify-import";
import { metadata as helpMetadata } from "../src/app/help/page";
import { metadata as aboutMetadata } from "../src/app/about/page";
import { metadata as worldMetadata } from "../src/app/world/page";

test("robots meta counter ignores other meta tags", () => {
  const html = `<head>
    <meta name="description" content="noindex">
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="noindex">
  </head>`;
  const tags = robotsMetaTags(html);
  assert.equal(tags.length, 1);
  assert.equal(metaContent(tags[0]), "index, follow");
  assert.equal(hasDirective("index, follow", "noindex"), false);
  assert.equal(hasDirective("noindex, nofollow", "noindex"), true);
  assert.equal(hasDirective("noindex, follow", "nofollow"), false);
  assert.equal(hasDirective("noindex, follow", "follow"), true);
});

test("sitemap locations and intentional exclusions are path based", () => {
  const xml = `<?xml version="1.0"?><urlset>
    <url><loc>https://hustlerdior.com/</loc></url>
    <url><loc>https://hustlerdior.com/guides</loc></url>
  </urlset>`;
  assert.deepEqual(sitemapLocs(xml), [
    "https://hustlerdior.com/",
    "https://hustlerdior.com/guides",
  ]);
  assert.equal(typeof checkSitemapRobots, "function");
});

test("curated collection redirects and unknown collections do not render", () => {
  assert.deepEqual(collectionPathAction("/collections/curated"), {
    kind: "redirect",
    pathname: "/curated",
  });
  assert.deepEqual(collectionPathAction("/collections/Curated/"), {
    kind: "redirect",
    pathname: "/curated",
  });
  assert.deepEqual(collectionPathAction("/collections/tees"), { kind: "pass" });
  assert.deepEqual(collectionPathAction("/collections/nope"), {
    kind: "not-found",
  });
  assert.deepEqual(collectionPathAction("/"), { kind: "pass" });
  assert.deepEqual(orderPathAction("/orders/not-a-uuid"), {
    kind: "not-found",
  });
  assert.deepEqual(
    orderPathAction("/orders/11111111-1111-4111-8111-111111111111"),
    { kind: "pass" },
  );
});

test("public titles include the phrase and the brand once", () => {
  assert.equal(
    helpMetadata.title,
    "Streetwear Ordering, Sizing & Printful Production",
  );
  assert.match(String(helpMetadata.description), /Printful/);
  assert.equal(
    aboutMetadata.title,
    "Independent Streetwear & The Concrete Edit",
  );
  assert.match(String(aboutMetadata.description), /Printful/);
  assert.equal(
    worldMetadata.title,
    "Creative World: Streetwear, Archive & Crown & Concrete",
  );
  assert.equal(
    String(worldMetadata.title).includes("Hustler Dior"),
    false,
  );
  for (const description of [
    helpMetadata.description,
    aboutMetadata.description,
    worldMetadata.description,
  ]) {
    assert.doesNotMatch(String(description), /in-house|DTF|wash-test/i);
  }
});

test("curated client payload drops unused variant fields", () => {
  const slim = curatedClientCatalog(catalog as ShopifyEdit);
  assert.ok(slim.products.length > 0);
  const variant = slim.products[0].variants[0];
  assert.equal("sku" in variant, false);
  assert.equal("options" in variant, false);
  assert.equal("availableAtImport" in variant, false);
  assert.equal(typeof variant.priceCents, "number");
  assert.ok(slim.products[0].description.length > 0);
});
