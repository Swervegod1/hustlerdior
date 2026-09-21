import { readFile, writeFile } from "node:fs/promises";
const token = process.env.PRINTFUL_API_TOKEN || process.env.PRINTFUL_API_KEY,
  store = process.env.PRINTFUL_STORE_ID;
const site = new URL(process.env.SITE_URL || "http://localhost:3000");
if (!token || !store || site.protocol !== "https:")
  throw new Error(
    "Set the server token, store ID and live HTTPS SITE_URL first.",
  );
const headers = {
  Authorization: `Bearer ${token}`,
  "X-PF-Store-Id": store,
  "Content-Type": "application/json",
};
const previous = await fetch("https://api.printful.com/v2/webhooks", {
  headers,
  signal: AbortSignal.timeout(15000),
});
if (previous.ok)
  throw new Error(
    "Existing v2 webhook configuration found. Review it before replacing; this script does not overwrite existing subscriptions.",
  );
if (previous.status !== 404)
  throw new Error(
    `Cannot inspect existing configuration (${previous.status}). No changes made.`,
  );
const ids = JSON.parse(
  await readFile("src/data/printful-catalog-ids.json", "utf8"),
);
if (
  !Array.isArray(ids) ||
  !ids.length ||
  ids.some((id) => !Number.isSafeInteger(id) || id <= 0)
)
  throw new Error("Run catalog:export to prepare valid catalog IDs.");
const response = await fetch("https://api.printful.com/v2/webhooks", {
  method: "POST",
  headers,
  signal: AbortSignal.timeout(15000),
  body: JSON.stringify({
    default_url: new URL("/api/webhooks/printful", site).href,
    events: [
      {
        type: "catalog_stock_updated",
        params: [{ name: "products", value: ids.map((id) => ({ id })) }],
      },
      { type: "catalog_price_changed" },
    ],
  }),
});
if (!response.ok)
  throw new Error(
    `Webhook registration failed (${response.status}). Inspect Printful before retrying.`,
  );
const data = await response.json();
if (!data.result?.secret_key || !data.result?.public_key)
  throw new Error(
    "Registration returned no keypair. Inspect Printful configuration before retrying.",
  );
await writeFile(
  ".env.webhook-secrets",
  `PRINTFUL_WEBHOOK_PUBLIC_KEY=${data.result.public_key}\nPRINTFUL_WEBHOOK_SECRET_HEX=${data.result.secret_key}\n`,
  { mode: 0o600, flag: "wx" },
);
console.log(
  "Webhook registered. Copy the two values from .env.webhook-secrets into Hostinger runtime environment variables, then redeploy. Do not commit that file.",
);
