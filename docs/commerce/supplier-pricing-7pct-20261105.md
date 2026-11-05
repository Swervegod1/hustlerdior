# Supplier inventory — approved 7% markup

The owner requested a 7% increase after being asked for the selling-price rule for supplier drafts. It applies to those supplier records, not existing Printful merchandise.

Rule: multiply each captured supplier amount by 107/100 and round to the nearest cent, with exact half-cent values rounded up. Integer arithmetic prevents floating-point errors. Reruns always use the original source amount, so the increase does not compound. Examples: $130.99 → $140.16; $147.99 → $158.35.

## Applied inventory

42 product/colorway drafts are stored in the existing commerce Supabase project `cjhymlfmovmchwvpdoel`, table `public.hd_supplier_inventory`. The table contains 718 option records across 36 products with approved retail amounts; 6 additional product drafts lack complete variants and remain unpriced. Each record is assigned to hustlerdior.com, hustlerdior.shop and hustlerdior.cloud as intended publication destinations. These are shared records, not three duplicate catalogs.

All 42 records are held, and saleEnabled remains false. **No storefront reads this staging table yet. Uploading drafts does not publish products.** The public .com catalog still contains 166 Printful products. The prior .shop/.cloud discovery refresh is unchanged. No deployment, paid order, email, Stripe product creation, payout change or Printful mutation occurred in this pricing update.

The SQL migration `hd_supplier_inventory_private_drafts` was applied successfully. RLS is enabled; both anon and authenticated lack SELECT privileges. Only the server service role has select/insert/update grants. Public RLS policies are intentionally absent because these are merchant-only staging records. The advisor's informational [RLS Enabled No Policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) observation is expected for this deny-by-default access model; do not add a public-read policy to silence it.

## Verification

- Uploaded 42 products in six resumable batches keyed by stable product ID.
- Full upload rerun: 0 changed, 0 added, no duplicate records.
- SQL recomputed all 718 prices: 0 incorrect or missing amounts.
- Per destination: 42 draft products, 718 options, 6 incomplete products.
- Four focused tests passed, including rounding, rerun idempotency, unchanged source observations, unrelated-record preservation and sale activation rejection.
- TypeScript checking and focused ESLint passed.

## Publication blockers

External merchandise cannot enter the existing Printful-only checkout. A separate supplier catalog/fulfillment adapter, durable manual purchase tasks and verified email delivery must be implemented and tested. Current stock, landed costs/shipping, missing source images and incomplete variant matrices also remain unresolved. A 7% markup approval does not verify those facts or approve fabricated variants.

Current readiness requirements still apply independently: working application database connection, authenticated worker, verified Stripe webhooks, approved merchant policies and sandbox payment/recovery tests. Preserve all environment values and keep payment gates intact.

## Reproduction and rollback

After staging a source manifest, run `node scripts/price-supplier-drafts.mjs inventory/supplier-import-20261105.json private-data/supplier-import-drafts.json`.

The private queue retains its first pre-markup copy as `supplier-import-drafts.json.before-7pct.json`. To undo pricing, restore merchant pricing fields from that backup for matching IDs only, preserving any later observations and unrelated rows. Keep publication held. Never delete payment history or replace environment secrets. A future public release must separately implement the read adapter and independent fulfillment gates.
