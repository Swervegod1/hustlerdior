import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import snapshot from "../src/data/catalog-snapshot.json" with { type: "json" };
import titleFile from "../src/data/title-overrides.json" with { type: "json" };
import { applyCatalogPolicy } from "../src/lib/catalog-policy";
import { llmsText } from "../src/lib/llms";
import { productSlugRedirect } from "../src/lib/product-route";
import { productSlug } from "../src/lib/slug";
import {
  catalogSlug,
  slugForTitle,
  titleOverrideMap,
  titleOverridesEnabled,
} from "../src/lib/title-overrides";
import type { Product } from "../src/lib/types";

const products = snapshot.products as Product[];

const RETITLED: Record<number, string> = {
  471749167: "YUM YUM DRIP Classic Tee",
  471749168: "Gunz-n-Roses Men's Classic Tee",
  471749169: "YUM YUM DRIP B&W Classic Tee",
  471749182: "SwerveGang Purp Men's Classic Tee",
  471749219: "Don't B A Menace Tees Classic Tee",
};

const PLAIN_MENS = [
  471749171, 471749172, 471749183, 471749186, 471749188, 471749191, 471749193,
  471749195,
];

/** Trademark HOLD rows. 471749168 stays on the approved Classic Tee title. */
const HOLD = [
  471749117, 476368797, 476371270, 476461521, 471749198, 471748994, 471749094,
  474263706, 471748990, 471749210, 471749206, 476804236, 476380927, 476802596,
  476817112, 476831542,
];

function filesUnder(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) found.push(...filesUnder(path));
    else found.push(path);
  }
  return found;
}

test("five classic tees take productSlug titles and old paths 308 once", () => {
  assert.equal(titleOverridesEnabled(), true);
  assert.deepEqual(
    titleFile.overrides.map((row) => row.productId).sort((a, b) => a - b),
    Object.keys(RETITLED)
      .map(Number)
      .sort((a, b) => a - b),
  );
  const overridden = new Set(titleFile.overrides.map((row) => row.productId));
  for (const id of [...PLAIN_MENS, 471749200, ...HOLD]) {
    assert.equal(overridden.has(id), false, String(id));
  }
  assert.equal(
    titleFile.overrides.find((row) => row.productId === 471749168)?.title,
    "Gunz-n-Roses Men's Classic Tee",
  );

  for (const [idText, title] of Object.entries(RETITLED)) {
    const id = Number(idText);
    const product = products.find((item) => item.id === id);
    assert.ok(product);
    const next = applyCatalogPolicy(product);
    assert.ok(next);
    const slug = productSlug(title, id);
    assert.equal(next.slug, slug);
    assert.equal(catalogSlug(id, product.name, product.slug), slug);
    assert.notEqual(product.slug, slug);
    assert.equal(
      productSlugRedirect(`/products/${product.slug}`),
      `/products/${slug}`,
    );
    assert.equal(productSlugRedirect(`/products/${slug}`), null);
    assert.equal(productSlugRedirect(`/products/${slug}/`), null);
  }
});

test("generic heavyweight tees and No Menace keep Printful slugs", () => {
  for (const id of [...PLAIN_MENS, 471749200]) {
    const product = products.find((item) => item.id === id);
    assert.ok(product);
    assert.equal(applyCatalogPolicy(product)?.slug, product.slug);
    assert.equal(productSlugRedirect(`/products/${product.slug}`), null);
    assert.match(product.slug, new RegExp(`-${id}$`));
  }
  const plain = products.find((item) => item.id === PLAIN_MENS[0]);
  assert.ok(plain);
  assert.match(plain.name, /Men's heavyweight tee/);
  assert.match(plain.slug, /heavyweight/);
});

test("disabling title overrides restores Printful titles and slugs", () => {
  const disabled = titleOverrideMap({ ...titleFile, enabled: false });
  assert.equal(disabled.size, 0);
  for (const [idText, title] of Object.entries(RETITLED)) {
    const id = Number(idText);
    const product = products.find((item) => item.id === id);
    assert.ok(product);
    assert.equal(
      slugForTitle(id, product.name, product.slug, undefined),
      product.slug,
    );
    assert.equal(
      slugForTitle(id, product.name, product.slug, disabled.get(id)),
      product.slug,
    );
    assert.equal(
      slugForTitle(id, product.name, product.slug, title),
      productSlug(title, id),
    );
    assert.notEqual(disabled.get(id), title);
  }
});

test("content, src, and llms.txt do not link retired slugs", () => {
  const retired = Object.keys(RETITLED).map((idText) => {
    const product = products.find((item) => item.id === Number(idText));
    assert.ok(product);
    assert.notEqual(
      product.slug,
      catalogSlug(product.id, product.name, product.slug),
    );
    return product.slug;
  });
  const sources = [
    ...filesUnder("content").map((path) => ({
      path,
      text: readFileSync(path, "utf8"),
    })),
    ...filesUnder("src").map((path) => ({
      path,
      text: readFileSync(path, "utf8"),
    })),
    { path: "llms.txt", text: llmsText() },
  ];
  const hits: string[] = [];
  for (const source of sources) {
    for (const slug of retired) {
      if (source.text.includes(`/products/${slug}`)) {
        hits.push(`${source.path} -> /products/${slug}`);
      }
    }
  }
  assert.deepEqual(hits, []);
});
