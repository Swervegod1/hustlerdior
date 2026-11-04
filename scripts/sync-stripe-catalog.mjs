import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import Stripe from "stripe";
import { normalizeProduct, productListSchema } from "../src/lib/normalize.ts";
import { planCatalog, priceMatches } from "../src/lib/stripe-catalog.ts";

async function main() {
  const args = process.argv.slice(2);
  const option = (key, fallback) => {
    const i = args.indexOf(key);
    return i < 0 ? fallback : args[i + 1];
  };
  const apply = args.includes("--apply");
  const mode = option("--mode");
  const expectedAccount = option("--account");
  const storeId = process.env.PRINTFUL_STORE_ID;
  const key = process.env.STRIPE_SECRET_KEY;
  if (
    !["live", "test"].includes(mode) ||
    !/^acct_[a-zA-Z0-9]+$/.test(expectedAccount ?? "") ||
    !/^\d+$/.test(storeId ?? "") ||
    !new RegExp(`^[rs]k_${mode}_`).test(key ?? "")
  )
    throw new Error(
      "Specify --account acct_… --mode live|test and matching server-side credentials/store ID.",
    );
  const scope = {
    accountId: expectedAccount,
    livemode: mode === "live",
    storeId,
  };
  const stripe = new Stripe(key, {
    apiVersion: "2026-08-26.dahlia",
    timeout: 20000,
    maxNetworkRetries: 3,
  });
  const [account, balance] = await Promise.all([
    stripe.accounts.retrieve(null),
    stripe.balance.retrieve(),
  ]);
  if (account.id !== expectedAccount || balance.livemode !== scope.livemode)
    throw new Error(
      "Authenticated Stripe account/mode does not match the requested import.",
    );
  console.log(
    JSON.stringify({
      stage: "stripe_identity_verified",
      accountId: account.id,
      livemode: balance.livemode,
    }),
  );
  const output = resolve(
    option("--output", "private-data/stripe-catalog.json"),
  );
  await mkdir(dirname(output), { recursive: true });
  async function atomic(path, value) {
    await writeFile(path + ".tmp", JSON.stringify(value, null, 2) + "\n", {
      mode: 0o600,
    });
    await rename(path + ".tmp", path);
  }
  async function printful(path) {
    const token =
      process.env.PRINTFUL_API_TOKEN || process.env.PRINTFUL_API_KEY;
    if (!token) throw new Error("Printful credential required");
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(`https://api.printful.com${path}`, {
        headers: { Authorization: `Bearer ${token}`, "X-PF-Store-Id": storeId },
        signal: AbortSignal.timeout(20000),
      });
      if (response.ok) return response.json();
      if (attempt === 3 || (response.status !== 429 && response.status < 500))
        throw new Error(
          `Printful read failed (${response.status}); credentials omitted`,
        );
      await new Promise((r) =>
        setTimeout(r, Math.min(10000, 1000 * 2 ** attempt)),
      );
    }
  }
  const stores = await printful("/stores");
  if (!stores.result.some((s) => String(s.id) === storeId))
    throw new Error("Printful token cannot access the selected store");
  console.log(JSON.stringify({ stage: "printful_store_verified", storeId }));
  let products = [];
  let offset = 0,
    reportedTotal;
  let sourceUrl = "https://api.printful.com/store/products",
    sourceFetchedAt;
  const catalogFile = option("--catalog");
  if (catalogFile) {
    const source = JSON.parse(await readFile(catalogFile, "utf8"));
    const age = Date.now() - Date.parse(source.fetchedAt);
    if (
      source.source !== "https://hustlerdior.com/api/products" ||
      String(source.storeId) !== storeId ||
      !Number.isFinite(age) ||
      age < -300000 ||
      age > 3600000 ||
      !Array.isArray(source.products) ||
      source.pages.at(-1)?.nextOffset !== null ||
      source.products.length !== source.pages[0]?.total
    )
      throw new Error(
        "Incomplete, stale or incorrectly scoped storefront export",
      );
    products = source.products;
    sourceUrl = source.source;
    sourceFetchedAt = source.fetchedAt;
    offset = source.products.length;
  } else {
    while (true) {
      const page = productListSchema.parse(
        await printful(
          `/store/products?limit=100&offset=${offset}&status=synced`,
        ),
      );
      if (reportedTotal !== undefined && reportedTotal !== page.paging.total)
        throw new Error("Catalog changed during enumeration; rerun");
      reportedTotal = page.paging.total;
      if (
        page.paging.offset !== offset ||
        (!page.result.length && offset < reportedTotal)
      )
        throw new Error("Incomplete catalog pagination");
      for (const item of page.result) {
        const raw = await printful(`/store/products/${item.id}`);
        const product = normalizeProduct(raw.result);
        if (!product)
          throw new Error(`Source product ${item.id} could not be normalized`);
        products.push(product);
        await new Promise((r) => setTimeout(r, 1100));
      }
      offset += page.result.length;
      if (offset >= reportedTotal) break;
    }
  }
  async function inventory() {
    const products = [],
      prices = [];
    for await (const product of stripe.products.list({ limit: 100 }))
      products.push(product);
    for await (const price of stripe.prices.list({ limit: 100, active: true }))
      prices.push(price);
    return { products, prices };
  }
  let existing = await inventory();
  let plan = planCatalog(products, existing.products, existing.prices, scope);
  const report = {
    ...scope,
    productsEnumerated: offset,
    normalizedProducts: products.length,
    createdProducts: 0,
    createdPrices: 0,
    matchedVariants: plan.mappings.length,
    skipped: plan.skipped,
    failures: [],
    remainingProducts: plan.missingProducts.length,
    remainingPrices: plan.missingPrices.length,
  };
  if (apply) {
    for (const item of plan.missingProducts) {
      try {
        const created = await stripe.products.create(item.params, {
          idempotencyKey: `${expectedAccount}:${mode}:${item.params.id}`,
        });
        existing.products.push(created);
        report.createdProducts++;
      } catch {
        // Handles lost responses and resumes beyond Stripe's idempotency-key retention.
        try {
          existing.products.push(
            await stripe.products.retrieve(item.params.id),
          );
        } catch {
          report.failures.push({
            productId: item.product.id,
            stage: "product",
          });
        }
      }
      await atomic(output + ".checkpoint.json", report);
    }
    plan = planCatalog(products, existing.products, existing.prices, scope);
    for (const item of plan.missingPrices) {
      if (!existing.products.some((p) => p.id === item.params.product))
        continue;
      try {
        const created = await stripe.prices.create(item.params, {
          idempotencyKey: `${expectedAccount}:${mode}:${item.params.lookup_key}`,
        });
        existing.prices.push(created);
        report.createdPrices++;
      } catch {
        const candidates = await stripe.prices.list({
          lookup_keys: [item.params.lookup_key],
          limit: 10,
        });
        const parent = existing.products.find(
          (p) => p.id === item.params.product,
        );
        const found = candidates.data.find((p) =>
          priceMatches(p, parent, item.variant, scope),
        );
        if (found) existing.prices.push(found);
        else
          report.failures.push({ variantId: item.variant.id, stage: "price" });
      }
      await atomic(output + ".checkpoint.json", report);
    }
    existing = await inventory();
    plan = planCatalog(products, existing.products, existing.prices, scope);
    report.remainingProducts = plan.missingProducts.length;
    report.remainingPrices = plan.missingPrices.length;
    report.mappedVariants = plan.mappings.length;
    const complete =
      !report.remainingProducts &&
      !report.remainingPrices &&
      !report.failures.length;
    if (complete) {
      let manifest = { version: 1, catalogs: [] };
      try {
        manifest = JSON.parse(await readFile(output, "utf8"));
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
      if (manifest.version !== 1 || !Array.isArray(manifest.catalogs))
        throw new Error("Invalid existing manifest");
      manifest.catalogs = manifest.catalogs.filter(
        (c) =>
          !(
            c.accountId === expectedAccount &&
            c.livemode === scope.livemode &&
            c.storeId === storeId
          ),
      );
      manifest.catalogs.push({
        ...scope,
        complete,
        sourceUrl,
        fetchedAt: sourceFetchedAt ?? new Date().toISOString(),
        importedAt: new Date().toISOString(),
        entries: plan.mappings,
      });
      await atomic(output, manifest);
    }
    process.exitCode = complete ? 0 : 1;
  }
  await atomic(output + ".report.json", report);
  console.log(
    JSON.stringify({ ...report, skipped: report.skipped.length }, null, 2),
  );
}
await main().catch((error) => {
  console.error(
    JSON.stringify({
      status: "failed",
      reason: "catalog_import_failed",
      errorType: error.name,
      statusCode: error.statusCode ?? null,
      code: error.code ?? null,
      secretsOmitted: true,
    }),
  );
  process.exitCode = 1;
});
