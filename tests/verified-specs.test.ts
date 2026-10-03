import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ProductDetails from "../src/components/ProductDetails";
import { llmsText } from "../src/lib/llms";
import { GUIDE_SLUGS } from "../src/lib/guide-route";
import { productData, serializeJsonLd } from "../src/lib/seo";
import {
  buildVerifiedSpecs,
  parseVerifiedSpecsCsv,
  type SpecSourceRow,
} from "../src/lib/verified-specs-build";
import {
  catalogFactsFor,
  detailLinesFor,
  statedPrintMethod,
} from "../src/lib/verified-specs";
import type { Product } from "../src/lib/types";
import snapshot from "../src/data/catalog-snapshot.json" with { type: "json" };
import committedJson from "../src/data/verified-specs.json" with { type: "json" };
import type { VerifiedSpecRecord } from "../src/lib/verified-specs-build";

const committed = committedJson as Record<string, VerifiedSpecRecord>;

function visibleText(html: string) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

const CSV_PATH = "docs/seo/verified-specs.csv";
const HOODIE_ID = 475170849;
const TEE_ID = 471748988;
const VEST_ID = 471748994;
const NO_WEIGHT_ID = 471749174;

function row(
  partial: Partial<SpecSourceRow> & { store_product_id: string },
): SpecSourceRow {
  return {
    store_product_name: "",
    blank_brand_model: "",
    fabric_or_material_text_from_printful: "",
    gsm_or_oz_if_stated_verbatim: "",
    fit_if_stated: "",
    print_method_if_stated: "",
    source_url_or_endpoint: "",
    ...partial,
  };
}

test("CSV build omits blank cells and keeps stated text verbatim", () => {
  const built = buildVerifiedSpecs([
    row({
      store_product_id: "11",
      blank_brand_model: "  Stanley/Stella  ",
      fabric_or_material_text_from_printful: "",
      gsm_or_oz_if_stated_verbatim: "   ",
      fit_if_stated: "• Oversized fit",
      print_method_if_stated: "",
      source_url_or_endpoint: "https://api.printful.com/store/products/11",
    }),
    row({
      store_product_id: "12",
      blank_brand_model:
        "UNVERIFIED: blank product_id 626 (Columbia Women's Fleece Vest) - catalog endpoint returned 404",
    }),
  ]);
  assert.deepEqual(built["11"], {
    blank: "Stanley/Stella",
    fit: "• Oversized fit",
  });
  assert.equal("fabric" in built["11"], false);
  assert.equal("weight" in built["11"], false);
  assert.equal("printMethod" in built["11"], false);
  assert.equal(built["12"], undefined);
  assert.equal(
    statedPrintMethod("not stated per product [blank offers: DTF printing]"),
    undefined,
  );
  assert.equal(
    statedPrintMethod(
      "DTF printing [placement file types: front_dtf] [blank offers: Embroidery, DTF printing]",
    ),
    "DTF printing",
  );
});

test("committed specs match the CSV build and do not invent weights", () => {
  const rows = parseVerifiedSpecsCsv(readFileSync(CSV_PATH, "utf8"));
  assert.equal(rows.length, 159);
  const built = buildVerifiedSpecs(rows);
  assert.deepEqual(built, committed);
  assert.equal(Object.keys(built).length, 158);
  assert.equal(built[String(VEST_ID)], undefined);
  const hoodie = built[String(HOODIE_ID)];
  assert.ok(hoodie);
  assert.equal(hoodie.weight, "· Fabric weight: 15 oz./yd.² (500 g/m²)");
  assert.equal("fit" in hoodie, false);
  assert.equal(
    built["471749167"]?.weight,
    "• Fabric weight: 5.0–5.3 oz/yd² (170-180 g/m²)",
  );
  assert.equal(
    built["471749137"]?.weight,
    "- Fabric weight in the EU: 6.34 oz./yd.² (215 g/m²) | - Fabric weight in the US: 7.08 oz./yd.² (240 g/m²)",
  );
  const noWeight = built[String(NO_WEIGHT_ID)];
  assert.ok(noWeight);
  assert.equal("weight" in noWeight, false);
});

test("product details render nothing when a product has no verified fields", () => {
  assert.equal(
    renderToStaticMarkup(createElement(ProductDetails, { productId: 1 })),
    "",
  );
  assert.equal(
    renderToStaticMarkup(createElement(ProductDetails, { productId: VEST_ID })),
    "",
  );
  assert.equal(detailLinesFor(VEST_ID).length, 0);
  assert.equal(catalogFactsFor(VEST_ID), null);
});

test("product details and JSON-LD use the same visible Printful facts", () => {
  const base = snapshot.products[0] as Product;
  for (const id of [HOODIE_ID, TEE_ID, NO_WEIGHT_ID]) {
    const html = renderToStaticMarkup(
      createElement(ProductDetails, { productId: id }),
    );
    const facts = catalogFactsFor(id);
    assert.ok(facts);
    const structured = productData({ ...base, id }, facts);
    const encoded = serializeJsonLd(structured);
    assert.equal(encoded.includes("<"), false);
    assert.deepEqual(JSON.parse(encoded), structured);
    assert.match(html, /Product details/);
    const text = visibleText(html);
    if (facts.material) {
      assert.equal(structured.material, facts.material);
      assert.ok(text.includes(facts.material), `material missing for ${id}`);
    } else {
      assert.equal(structured.material, undefined);
    }
    if (facts.weight) {
      assert.equal(structured.weight?.["@type"], "QuantitativeValue");
      assert.equal(structured.weight?.name, "Fabric weight");
      assert.equal(structured.weight?.value, facts.weight);
      assert.ok(text.includes(facts.weight));
    } else {
      assert.equal(structured.weight, undefined);
      assert.equal(text.includes("Fabric weight"), false);
    }
    for (const property of structured.additionalProperty ?? []) {
      assert.equal(property["@type"], "PropertyValue");
      assert.ok(text.includes(property.value), property.name);
    }
    const hidden = [
      "loopback",
      "French terry",
      "no-shrink",
      "in-house",
      "600 g/m",
    ];
    for (const phrase of hidden) {
      assert.equal(
        html.toLowerCase().includes(phrase.toLowerCase()),
        false,
        phrase,
      );
      assert.equal(
        encoded.toLowerCase().includes(phrase.toLowerCase()),
        false,
        phrase,
      );
    }
  }

  const hoodieHtml = renderToStaticMarkup(
    createElement(ProductDetails, { productId: HOODIE_ID }),
  );
  assert.match(hoodieHtml, /Stanley\/Stella SASU057 \/ STSU278/);
  assert.match(hoodieHtml, /15 oz\.\/yd\.² \(500 g\/m²\)/);
  assert.match(hoodieHtml, />DTF printing</);
  assert.equal(hoodieHtml.includes("Embroidery"), false);
  assert.equal(hoodieHtml.includes("blank offers"), false);

  const teeHtml = renderToStaticMarkup(
    createElement(ProductDetails, { productId: TEE_ID }),
  );
  assert.match(teeHtml, /5\.9 oz\.\/yd\.² \(200 g\/m²\)/);
  assert.equal(teeHtml.includes("DTF"), false);
  assert.equal(teeHtml.includes("Embroidery"), false);

  const bare = productData(base, null);
  assert.equal(bare.material, undefined);
  assert.equal(bare.weight, undefined);
  assert.equal(bare.additionalProperty, undefined);
});

test("llms.txt describes fulfillment without garment specs", () => {
  const text = llmsText();
  assert.match(text, /independent streetwear brand from Virginia Beach/);
  assert.match(text, /made to order and fulfilled by Printful/);
  assert.match(text, /https:\/\/hustlerdior\.com\/guides\n/);
  for (const slug of GUIDE_SLUGS) {
    assert.ok(text.includes(`https://hustlerdior.com/guides/${slug}`), slug);
  }
  for (const path of [
    "/fit-guide",
    "/help",
    "/collections/tees",
    "/collections/hoodies-layers",
    "/collections/mens-streetwear",
    "/collections/womens-streetwear",
    "/sitemap.xml",
  ]) {
    assert.ok(text.includes(`https://hustlerdior.com${path}`), path);
  }
  assert.equal(text.includes("/collections/"), true);
  assert.equal((text.match(/\/collections\//g) ?? []).length, 4);
  for (const phrase of [
    "gsm",
    "oz/",
    "DTF",
    "embroidery",
    "in-house",
    "manufactur",
    "loopback",
    "French terry",
    "no-shrink",
  ]) {
    assert.equal(
      text.toLowerCase().includes(phrase.toLowerCase()),
      false,
      phrase,
    );
  }
});
