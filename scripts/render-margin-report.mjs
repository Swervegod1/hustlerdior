import { readFile, writeFile } from "node:fs/promises";
import { contribution } from "../src/lib/margins.ts";

const audit = JSON.parse(
  await readFile("private-data/margin-audit.json", "utf8"),
);
if (!audit.completedAt)
  throw new Error("Complete the margin audit before publishing a report.");
const rows = audit.results.toSorted(
  (a, b) =>
    b.productId - a.productId || a.currentPriceCents - b.currentPriceCents,
);
const dollars = (cents) =>
  `${cents < 0 ? "-" : ""}$${(Math.abs(cents) / 100).toFixed(2)}`;
const percent = (fraction) => `${(fraction * 100).toFixed(1)}%`;
const groups = [...Map.groupBy(rows, (r) => r.productId)].map(
  ([productId, samples]) => ({
    productId,
    name: samples[0].name,
    samples: samples.length,
    minCurrent: Math.min(...samples.map((s) => s.currentPriceCents)),
    maxCurrent: Math.max(...samples.map((s) => s.currentPriceCents)),
    minFloor: Math.min(
      ...samples.map((s) => s.suggestedWithShippingCharged.priceCents),
    ),
    maxFloor: Math.max(
      ...samples.map((s) => s.suggestedWithShippingCharged.priceCents),
    ),
    losingSamples: samples.filter(
      (s) => s.currentWithShippingCharged.contributionCents < 0,
    ).length,
  }),
);
function csvCell(value) {
  let s = String(value ?? "");
  if (/^[=+@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
}
function csv(data) {
  return data.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
await writeFile(
  "private-data/pricing-variants.csv",
  csv([
    [
      "Product ID",
      "Product",
      "Variant ID",
      "Size",
      "Color",
      "Currency",
      "Current price",
      "Production subtotal",
      "Supplier shipping",
      "Supplier total including quoted tax and fees",
      "Current contribution after fee and reserve",
      "Current contribution percent",
      "35% floor shipping charged",
      "35% floor free shipping",
      "Draft retail (never below current)",
      "Quote timestamp",
    ],
    ...rows.map((r) => [
      r.productId,
      r.name,
      r.variantId,
      r.size,
      r.color,
      "USD",
      (r.currentPriceCents / 100).toFixed(2),
      r.costs.subtotal,
      r.costs.shipping,
      r.costs.total,
      (r.currentWithShippingCharged.contributionCents / 100).toFixed(2),
      percent(r.currentWithShippingCharged.contributionRate),
      (r.suggestedWithShippingCharged.priceCents / 100).toFixed(2),
      (r.suggestedWithFreeShipping.priceCents / 100).toFixed(2),
      (
        Math.max(
          r.currentPriceCents,
          r.suggestedWithShippingCharged.priceCents,
        ) / 100
      ).toFixed(2),
      r.quotedAt,
    ]),
  ]),
);
await writeFile(
  "private-data/pricing-products.csv",
  csv([
    [
      "Product ID",
      "Product",
      "Variants sampled",
      "Lowest sampled current retail",
      "Highest sampled current retail",
      "Lowest sampled 35% price floor",
      "Highest sampled 35% price floor",
      "Sampled variants with negative contribution",
    ],
    ...groups.map((p) => [
      p.productId,
      p.name,
      p.samples,
      p.minCurrent / 100,
      p.maxCurrent / 100,
      p.minFloor / 100,
      p.maxFloor / 100,
      p.losingSamples,
    ]),
  ]),
);
const highlightIds = [471752024, 471749220, 471749219, 471749134, 471749218];
const highlights = rows.filter((r) => highlightIds.includes(r.productId));
const lowestTee = rows.find((r) => r.productId === 471749219 && r.size === "S");
const example = contribution(
  2800,
  Math.round(lowestTee.costs.total * 100),
  Math.round(lowestTee.costs.shipping * 100),
);
const note = `# Hustler Dior — pricing and margin review

Prepared ${audit.completedAt.slice(0, 10)} using your Printful store’s read-only cost-estimation endpoint. No order, purchase or retail-price update was submitted.

## What the live quotes show

${rows.length} successful one-item estimates cover ${groups.length} of the 100 imported products. We attempted ${audit.plannedSamples} samples: the active variants at the low and high ends of each product’s current retail pricing, with duplicate variant IDs removed. These samples are not a complete audit of all 2,444 variants.

**${rows.filter((r) => r.currentWithShippingCharged.contributionCents < 0).length} of ${rows.length} sampled variants have negative contribution at current retail prices under the assumptions below.** ${groups.filter((p) => p.losingSamples).length} of the ${groups.length} quoted products have at least one losing sample. The source often assigns the same retail price to sizes with different production costs.

| Piece and sampled size | Current retail | Printful production subtotal | Printful total incl. shipping/tax/fees | Current contribution | 35% price floor + charged shipping |
| --- | ---: | ---: | ---: | ---: | ---: |
${highlights.map((r) => `| ${r.name.replaceAll("|", "/")} — ${r.size} | ${dollars(r.currentPriceCents)} | ${dollars(Math.round(r.costs.subtotal * 100))} | ${dollars(Math.round(r.costs.total * 100))} | ${dollars(r.currentWithShippingCharged.contributionCents)} (${percent(r.currentWithShippingCharged.contributionRate)}) | ${dollars(r.suggestedWithShippingCharged.priceCents)} |`).join("\n")}

These floors are scenario calculations, not evidence that customers will accept those prices. Do not raise every product to a mathematical floor without testing demand. The CSV includes a separate **draft retail** column: the greater of current retail and the calculated floor, so healthy prices are not automatically reduced.

## Margin target and explicit assumptions

- Planning target: **35% contribution margin before advertising, subscriptions, owner pay, overhead and income tax**, after the estimated fulfillment bill, payment processing and a returns allowance. It is not net profit and not a 35% markup.
- Currency and scenario: USD, one item per order, a fictional estimate-only address in Virginia Beach, VA 23456. No actual customer/address was used. Shipping, taxes, discounts, digitization and other fees come from the current Printful estimate for that destination. Other locations and basket sizes require new quotes.
- Charged-shipping scenario: the customer pays the exact supplier shipping line. Free-shipping floors are calculated separately in the variant CSV. No free-shipping threshold has been advertised.
- Processing benchmark: 2.9% of product plus charged shipping, plus $0.30 per order, using [Stripe’s published US domestic-card pricing](https://stripe.com/pricing). A payment account is not connected. International cards, currency conversion, alternative methods, tax tools and fees on customer sales tax are outside this model.
- Returns allowance: 3% of product revenue, an adjustable planning assumption rather than measured store history. It does not guarantee coverage for actual refunds, remakes, chargebacks or lost shipments.
- All quoted Printful taxes and fees are treated as merchant costs. Customer sales tax is excluded from revenue. No future tax recovery, resale exemption or volume discount is assumed.

The fee and reserve are rounded up to cents. Floors round up to the next .99 price and are checked again against the target.

Let P be product retail, S be shipping charged, C be Printful’s full quoted total, f the processing rate, r the reserve rate, b the fixed fee and m the target margin:

    contribution = (P + S) - C - ceil(f × (P + S)) - b - ceil(r × P)
    margin = contribution / (P + S)
    unrounded floor P = [C + b - (1 - f - m) × S] / (1 - f - r - m)

Use a consistent currency unit in the algebra; the implementation uses integer cents and validates every input.

## Recommended opening assortment

1. **Lead with the lower-cost heavyweight tee designs.** The sampled S Black “Don’t B A Menace” tee costs $9.44 to produce. At an illustrative $28 retail plus the quoted $4.95 shipping, its scenario contribution is ${dollars(example.contributionCents)} (${percent(example.contributionRate)}). This is an example launch-price test, not a market forecast. Sample every offered size before applying it: the sampled 5XL costs more and needs its own price.
2. **Keep higher-margin current prices where demand supports them.** The price-floor report is not a sale or discount list. Give each design a clear customer-facing name and photograph its actual fit before deciding whether a premium price is justified.
3. **Rework high-cost basics.** A $28.75 production-cost tee requires a much higher retail floor than a $9.44 tee. Compare print placements, base garments and verified supplier costs before relying on a price jump alone.
4. **Price larger sizes individually.** The SkullFX 4XL sample costs $23.19 before shipping while the current retail is $18. Use the exact variant’s landed cost rather than the cheapest size as the floor for the whole product.
5. **Fund growth from contribution, then measure retention.** For a test acquisition budget, reserve part of the modeled contribution for overhead and variance. For example, on the illustrative $28 tee above, a $7 acquisition-cost cap leaves about ${dollars(example.contributionCents - 700)} before overhead. This $7 cap is a proposed test budget, not an observed advertising result.

## Catalog issue to resolve

Both attempted samples of product **471748994**, “Crown and Concrete Embroidered Women’s Columbia Fleece Vest | Cute Logo,” failed cost estimation. A diagnostic estimate for sync variant 5497843818 returned “Unavailable variant id used.” Re-sync or replace the unavailable variants and re-quote before selling this piece. No cost or margin is invented for it.

## What still changes the result

Multi-item shipping and discounts, destination taxes, actual payment fees, print changes, promotions and acquisition costs can alter contribution. Costs are point-in-time estimates. Re-quote every intended sellable size/color and capture live costs before turning these draft floors into a pricing policy. Checkout must use the same approved retail source as the storefront and fulfillment record.

## Reproduce the review

Run from the project after setting server-only Printful credentials:

\`\`\`bash
npm run catalog:export
npm run margin:audit
npm run margin:report
\`\`\`

Reports are written under private-data and are excluded from the website bundle, Git, container context and recovery archives. The audit only calls POST /orders/estimate-costs. It never calls order creation or writes prices. Keep report files private; do not put supplier costs in public pages or SEO markup.
`;
await writeFile("private-data/margin-review.md", note);
console.log(
  `Created pricing variants CSV (${rows.length} rows), products CSV (${groups.length} rows), and margin-review.md.`,
);
