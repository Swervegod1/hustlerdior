// scripts/temporary-margin-audit.mjs
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";

// src/lib/margins.ts
var planningAssumptions = {
  processingRate: 0.029,
  processingFixedCents: 30,
  returnsReserveRate: 0.03,
  targetContributionRate: 0.35
};
function validate(cents, assumptions) {
  if (cents.some((n) => !Number.isSafeInteger(n) || n < 0))
    throw new Error("Use non-negative, safe integer cents.");
  const rates = [
    assumptions.processingRate,
    assumptions.returnsReserveRate,
    assumptions.targetContributionRate
  ];
  if (rates.some((n) => !Number.isFinite(n) || n < 0 || n >= 1) || rates.reduce((a, b) => a + b, 0) >= 1 || !Number.isSafeInteger(assumptions.processingFixedCents) || assumptions.processingFixedCents < 0)
    throw new Error("Invalid margin assumptions.");
}
function contribution(priceCents, fulfillmentTotalCents, shippingChargedCents, assumptions = planningAssumptions) {
  validate(
    [priceCents, fulfillmentTotalCents, shippingChargedCents],
    assumptions
  );
  const revenueCents = priceCents + shippingChargedCents;
  const processingCents = Math.ceil(revenueCents * assumptions.processingRate) + assumptions.processingFixedCents;
  const reserveCents = Math.ceil(priceCents * assumptions.returnsReserveRate);
  const contributionCents = revenueCents - fulfillmentTotalCents - processingCents - reserveCents;
  return {
    revenueCents,
    processingCents,
    reserveCents,
    contributionCents,
    // Margin denominator is total merchant revenue, including charged shipping; excludes customer sales tax.
    contributionRate: revenueCents ? contributionCents / revenueCents : 0
  };
}
function recommendPrice(fulfillmentTotalCents, shippingChargedCents, assumptions = planningAssumptions) {
  validate([fulfillmentTotalCents, shippingChargedCents], assumptions);
  const {
    processingRate: f,
    returnsReserveRate: r,
    targetContributionRate: m
  } = assumptions;
  const denominator = 1 - f - r - m;
  const floor = Math.max(
    0,
    Math.ceil(
      (fulfillmentTotalCents + assumptions.processingFixedCents - (1 - f - m) * shippingChargedCents) / denominator
    )
  );
  let priceCents = Math.max(99, Math.ceil((floor + 1) / 100) * 100 - 1);
  while (contribution(
    priceCents,
    fulfillmentTotalCents,
    shippingChargedCents,
    assumptions
  ).contributionRate < m)
    priceCents += 100;
  return {
    priceCents,
    ...contribution(
      priceCents,
      fulfillmentTotalCents,
      shippingChargedCents,
      assumptions
    )
  };
}

// scripts/temporary-margin-audit.mjs
var token = process.env.PRINTFUL_API_TOKEN || process.env.PRINTFUL_API_KEY;
var store = process.env.PRINTFUL_STORE_ID;
if (!token || !store)
  throw new Error("Set the server-only Printful credentials in .env.local.");
var snapshot = JSON.parse(
  await readFile(new URL("./catalog.json", import.meta.url), "utf8")
);
var recipient = {
  address1: "100 Example Street",
  city: "Virginia Beach",
  country_code: "US",
  state_code: "VA",
  zip: "23456"
};
var tasks = snapshot.products.flatMap((product) => {
  const active = product.variants.filter((v) => v.stock === "available");
  if (!active.length) return [];
  const sorted = active.toSorted((a, b) => a.priceCents - b.priceCents);
  const samples = [sorted[0], sorted.at(-1)];
  return [...new Map(samples.map((v) => [v.id, v])).values()].map(
    (variant) => ({ product, variant })
  );
});
var output = new URL("./margin-audit.json", import.meta.url).pathname;
var audit = {
  startedAt: (/* @__PURE__ */ new Date()).toISOString(),
  completedAt: null,
  storeId: Number(store),
  catalogAsOf: snapshot.fetchedAt,
  sampleMethod: "One lowest-retail-price and one highest-retail-price active variant per product, deduplicated by variant ID. Not all sizes, colors or destinations.",
  quantityPerEstimate: 1,
  destination: recipient,
  assumptions: planningAssumptions,
  plannedSamples: tasks.length,
  results: [],
  errors: []
};
var index = 0;
var lastStart = 0;
var rateGate = Promise.resolve();
var checkpointGate = Promise.resolve();
var wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function pace() {
  const gate = rateGate.then(async () => {
    await wait(Math.max(0, 850 - (Date.now() - lastStart)));
    lastStart = Date.now();
  });
  rateGate = gate.catch(() => {
  });
  await gate;
}
async function checkpoint() {
  const bytes = JSON.stringify(audit, null, 2);
  const job = checkpointGate.then(async () => {
    await writeFile(`${output}.tmp`, bytes, { mode: 384 });
    await rename(`${output}.tmp`, output);
  });
  checkpointGate = job.catch(() => {
  });
  await job;
}
async function estimate(variantId) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await pace();
    try {
      const response = await fetch(
        "https://api.printful.com/orders/estimate-costs",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-PF-Store-Id": store,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            recipient,
            items: [{ sync_variant_id: variantId, quantity: 1 }],
            retail_costs: { currency: "USD" }
          }),
          signal: AbortSignal.timeout(25e3)
        }
      );
      if ((response.status === 429 || response.status >= 500) && attempt < 2) {
        const delay = Number(response.headers.get("retry-after"));
        await wait(
          Number.isFinite(delay) && delay > 0 ? Math.min(delay * 1e3, 6e4) : 3e3 * (attempt + 1)
        );
        continue;
      }
      if (!response.ok) throw new Error(`Estimate HTTP ${response.status}`);
      const result = (await response.json()).result;
      if (!result?.costs || result.costs.currency !== "USD")
        throw new Error("Missing USD costs");
      for (const key of ["subtotal", "shipping", "total"]) {
        if (!Number.isFinite(Number(result.costs[key])) || Number(result.costs[key]) < 0)
          throw new Error("Invalid quote amount");
      }
      return result.costs;
    } catch (error) {
      if (attempt === 2 || String(error.message).includes("HTTP 4"))
        throw error;
    }
  }
  throw new Error("Estimate failed");
}
console.log(
  `Estimating ${tasks.length} representative variants; no orders or price updates will be created.`
);
await Promise.all(
  Array.from({ length: 2 }, async () => {
    while (index < tasks.length) {
      const { product, variant } = tasks[index++];
      try {
        const costs = await estimate(variant.id);
        const total = Math.round(Number(costs.total) * 100), shipping = Math.round(Number(costs.shipping) * 100);
        audit.results.push({
          productId: product.id,
          name: product.name,
          category: product.category,
          variantId: variant.id,
          size: variant.size,
          color: variant.color,
          currentPriceCents: variant.priceCents,
          quotedAt: (/* @__PURE__ */ new Date()).toISOString(),
          costs,
          currentWithShippingCharged: contribution(
            variant.priceCents,
            total,
            shipping
          ),
          suggestedWithShippingCharged: recommendPrice(total, shipping),
          suggestedWithFreeShipping: recommendPrice(total, 0)
        });
      } catch (error) {
        audit.errors.push({
          productId: product.id,
          variantId: variant.id,
          error: String(error.message)
        });
      }
      await checkpoint();
      const done = audit.results.length + audit.errors.length;
      if (done % 10 === 0)
        console.log(
          `Estimated ${done}/${tasks.length}; successful ${audit.results.length}, errors ${audit.errors.length}`
        );
    }
  })
);
audit.completedAt = (/* @__PURE__ */ new Date()).toISOString();
await checkpoint();
console.log(
  `Saved ${audit.results.length} cost estimates to ${output}; ${audit.errors.length} errors. No customer data or credentials in report.`
);
