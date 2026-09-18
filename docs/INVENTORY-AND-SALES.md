# Inventory and sales release — September 15, 2026

## Inventory coverage

| Source | Products | Variants | State |
|---|---:|---:|---|
| Printful store 18747907, Chase’s Store | 100 | 2,444 | Refreshed September 15; live runtime reads remain scoped to this store. |
| Shopify 9t6qcq-0d.myshopify.com | 46 | 399 | Refreshed September 15; all variants unavailable for sale. |

The working supplied Printful credential exposes exactly one native store. Its GET /stores response has paging.total = 1. The other distinct supplied Printful credential returned HTTP 401. This release does not claim access to any other Printful store. Additional stores require a valid account-level token or valid per-store credentials; never infer access from an ID. No upstream inventory, artwork, price, product publication, or order was changed.

Shopify images are 252 links on the merchant’s Shopify CDN, not locally downloaded originals. Full product descriptions, variants, SKUs, source IDs, prices, and availability are retained in inventory/shopify-import.json. The public Extended Edit projection remains browse-only and noindex. This is a one-time Shopify refresh, not a scheduled synchronization.

## Import commands

- `npm run inventory:printful`: paginates every store exposed by PRINTFUL_API_TOKEN, then its complete inventory. Records missing/ignored/unsynced state without making it sellable. Writes the active catalog snapshot only for PRINTFUL_STORE_ID. Keeps original storefront exports if fetching fails.
- `npm run inventory:shopify`: validates inventory/shopify-import.json and produces the public projection. Refresh the source through the validated Shopify GraphQL query in scripts/shopify-import.graphql before running it.

The current storefront fulfillment client uses one configured Printful store. Multi-store imports are retained for review; enabling checkout across multiple fulfillment stores requires explicit order and shipping routing. No keys, original artwork files, customer records, or payment data are included in these inventory exports.

## Consumer sales experience

- A refined dark bag drawer with product photography, an animated subtotal, quantity controls, saved-bag message, and Your edit → Delivery → Payment progress.
- Complementary pieces with inline color/size selection and exact selected-variant pricing.
- Direct add for single-option items; multi-option products require the customer’s selection before adding.
- Success feedback, out-of-stock filtering, same-currency checks, and product detail/try-on links.
- Photo-based checkout review, Edit bag action, a sticky desktop summary, and stacked mobile layout.
- Clear payment readiness status. Optional add-ons never become automatic cart entries. No fabricated scarcity, discounts, reviews, or free-shipping thresholds.

## Validation

TypeScript and targeted ESLint passed. All 23 selected commerce, SEO, margin, Shopify import, and merchandising tests passed. A stale local Turbopack persistence cache was moved aside before rebuilding. Final build, deployment, browser, and HTTPS results are supplied in the separate launch receipt.

Payment processing, database/webhook setup, production payment testing, and paid AI generation are not activated by this visual release. Do not present this as a working physical-terminal POS or completed payment launch.
