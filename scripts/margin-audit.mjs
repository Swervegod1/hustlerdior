import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import {
  contribution,
  recommendPrice,
  planningAssumptions,
} from "../src/lib/margins.ts";

const token = process.env.PRINTFUL_API_TOKEN,
  store = process.env.PRINTFUL_STORE_ID;
if (!token || !store)
  throw new Error("Set the server-only Printful credentials in .env.local.");
const snapshot = JSON.parse(
  await readFile("src/data/catalog-snapshot.json", "utf8"),
);
// Explicitly fictional, estimate-only US destination; never used to create an order.
const recipient = {
  address1: "100 Example Street",
  city: "Virginia Beach",
  country_code: "US",
  state_code: "VA",
  zip: "23456",
};
const tasks = snapshot.products.flatMap((product) => {
  const active = product.variants.filter((v) => v.stock === "available");
  if (!active.length) return [];
  const sorted = active.toSorted((a, b) => a.priceCents - b.priceCents);
  const samples = [sorted[0], sorted.at(-1)];
  return [...new Map(samples.map((v) => [v.id, v])).values()].map(
    (variant) => ({ product, variant }),
  );
});
await mkdir("private-data", { recursive: true });
const output = "private-data/margin-audit.json";
const audit = {
  startedAt: new Date().toISOString(),
  completedAt: null,
  storeId: Number(store),
  catalogAsOf: snapshot.fetchedAt,
  sampleMethod:
    "One lowest-retail-price and one highest-retail-price active variant per product, deduplicated by variant ID. Not all sizes, colors or destinations.",
  quantityPerEstimate: 1,
  destination: recipient,
  assumptions: planningAssumptions,
  plannedSamples: tasks.length,
  results: [],
  errors: [],
};
let index = 0,
  lastStart = 0,
  rateGate = Promise.resolve(),
  checkpointGate = Promise.resolve();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function pace() {
  const gate = rateGate.then(async () => {
    await wait(Math.max(0, 850 - (Date.now() - lastStart)));
    lastStart = Date.now();
  });
  rateGate = gate.catch(() => {});
  await gate;
}
async function checkpoint() {
  const bytes = JSON.stringify(audit, null, 2);
  const job = checkpointGate.then(async () => {
    await writeFile(`${output}.tmp`, bytes, { mode: 0o600 });
    await rename(`${output}.tmp`, output);
  });
  checkpointGate = job.catch(() => {});
  await job;
}
async function estimate(variantId) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await pace();
    try {
      // This endpoint calculates costs only. Never call POST /orders from this script.
      const response = await fetch(
        "https://api.printful.com/orders/estimate-costs",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-PF-Store-Id": store,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient,
            items: [{ sync_variant_id: variantId, quantity: 1 }],
            retail_costs: { currency: "USD" },
          }),
          signal: AbortSignal.timeout(25000),
        },
      );
      if ((response.status === 429 || response.status >= 500) && attempt < 2) {
        const delay = Number(response.headers.get("retry-after"));
        await wait(
          Number.isFinite(delay) && delay > 0
            ? Math.min(delay * 1000, 60000)
            : 3000 * (attempt + 1),
        );
        continue;
      }
      if (!response.ok) throw new Error(`Estimate HTTP ${response.status}`);
      const result = (await response.json()).result;
      if (!result?.costs || result.costs.currency !== "USD")
        throw new Error("Missing USD costs");
      for (const key of ["subtotal", "shipping", "total"]) {
        if (
          !Number.isFinite(Number(result.costs[key])) ||
          Number(result.costs[key]) < 0
        )
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
  `Estimating ${tasks.length} representative variants; no orders or price updates will be created.`,
);
await Promise.all(
  Array.from({ length: 2 }, async () => {
    while (index < tasks.length) {
      const { product, variant } = tasks[index++];
      try {
        const costs = await estimate(variant.id);
        const total = Math.round(Number(costs.total) * 100),
          shipping = Math.round(Number(costs.shipping) * 100);
        audit.results.push({
          productId: product.id,
          name: product.name,
          category: product.category,
          variantId: variant.id,
          size: variant.size,
          color: variant.color,
          currentPriceCents: variant.priceCents,
          quotedAt: new Date().toISOString(),
          costs,
          currentWithShippingCharged: contribution(
            variant.priceCents,
            total,
            shipping,
          ),
          suggestedWithShippingCharged: recommendPrice(total, shipping),
          suggestedWithFreeShipping: recommendPrice(total, 0),
        });
      } catch (error) {
        audit.errors.push({
          productId: product.id,
          variantId: variant.id,
          error: String(error.message),
        });
      }
      await checkpoint();
      const done = audit.results.length + audit.errors.length;
      if (done % 10 === 0)
        console.log(
          `Estimated ${done}/${tasks.length}; successful ${audit.results.length}, errors ${audit.errors.length}`,
        );
    }
  }),
);
audit.completedAt = new Date().toISOString();
await checkpoint();
console.log(
  `Saved ${audit.results.length} cost estimates to ${output}; ${audit.errors.length} errors. No customer data or credentials in report.`,
);
