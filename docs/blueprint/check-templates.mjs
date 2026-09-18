import assert from "node:assert/strict";
import { buildProductGraph, serializeJsonLd, descriptionTemplate } from "./product-schema.mjs";
import { minimumRevenueMinor, contributionMinor } from "./contribution.mjs";

// Deliberately synthetic records. These are not live catalog claims.
const input = {
  store: { name: "Hustler Dior", url: "https://hustlerdior.com", logoUrl: "https://hustlerdior.com/test-logo.png" },
  product: {
    canonicalUrl: "https://hustlerdior.com/products/test-tee",
    name: "TEST ONLY <script>alert(1)</script>", description: "Verified description fixture.",
    images: ["https://media.hustlerdior.cloud/test.webp"], sku: "TEST-L", isOwnLabel: true,
    material: "Cotton", color: "Black", size: "L", fabricGsm: 240,
    silhouette: "Oversized", drape: "Structured", sizingRecommendation: "Check measurements.",
    commerceOpen: true, priceMinor: 4800, currency: "USD", availability: "InStock",
  },
  faqs: [{ question: "How does the sample fit?", answer: "Use the published measurements." }],
};
const graph = buildProductGraph(input);
const encoded = serializeJsonLd(graph);
assert(!encoded.includes("<script>"));
assert.equal(JSON.parse(encoded)["@graph"].find(x => x["@type"] === "Offer").price, "48.00");
assert.equal(graph["@graph"][0]["@type"], "OnlineStore");
assert(!buildProductGraph({ ...input, product: { ...input.product, commerceOpen: false } })["@graph"].some(x => x["@type"] === "Offer"));
assert.throws(() => buildProductGraph({ ...input, product: { ...input.product, priceMinor: -1 } }));
assert.throws(() => buildProductGraph({ ...input, product: { ...input.product, availability: "LimitedHype" } }));
assert.throws(() => buildProductGraph({ ...input, store: { ...input.store, physicalShop: { verified: false } } }));
assert.equal(descriptionTemplate.split(/\s+/).length, 40);
const example = descriptionTemplate.replace("{name}", "Concrete").replace("{gsm}", "240").replace("{fabric}", "cotton").replace("{drape}", "structured");
assert.equal(example.split(/\s+/).length, 40);
const economics = { fixedCostsMinor: 5580, feeRate: 0.029, reserveRate: 0.04, marginRate: 0.35 };
assert.equal(minimumRevenueMinor(economics), 9607);
assert.equal(contributionMinor({ ...economics, revenueMinor: 10000 }), 3730);
assert(contributionMinor({ ...economics, revenueMinor: 9500 }) / 9500 < 0.35);
assert.throws(() => minimumRevenueMinor({ ...economics, marginRate: 0.99 }));
console.log("Schema, preview-offer suppression, script escaping, 40-word copy, and contribution guard checks passed.");
