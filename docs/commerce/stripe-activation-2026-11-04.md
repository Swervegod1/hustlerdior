# Stripe integration and activation evidence — 2026-11-04

## Verified identity and import

Hostinger’s actual server credentials authenticated to Stripe account `acct_1T2CVABQlp4SmhNo`, live mode, and Printful store `18747907`. The Stripe account’s website and support URL identify hustlerdior.com; its descriptor is HUSTLERDIOR. The other connected Stripe account, including its sandbox, was excluded.

The current public Printful-backed catalog was enumerated at offsets 0, 100, 120 and 140: 159 products and 3,549 variants. A failed larger second-page request was recovered using smaller pages. No stale snapshot count was assumed.

| Result | Products | Variant Prices |
|---|---:|---:|
| Existing exact matches | 116 | 2,688 |
| Created | 43 | 844 |
| Final mapped catalog | 159 | 3,532 |
| Unavailable variants skipped | — | 17 |
| Failed records / remaining import work | 0 | 0 |
| Second applied import: newly created | 0 | 0 |

Skipped variants comprise 16 out of stock and one discontinued. Historical Prices, existing exact matches, unrelated Products and unrelated webhooks were preserved. Existing Product names (ignoring surrounding whitespace), primary images and nonempty descriptions match the current catalog; descriptive variant counts were checked. New descriptions use the actual product name without invented specifications. Source currency is USD and Prices use exact retail cents, one-time/per-unit billing and explicit exclusive tax behavior.

The first host-side attempt stopped before completing the import. A subsequent attempt used the complete fresh catalog export, completed successfully, and a second applied run proved zero new records. Account and store authentication occurred server-side without exporting credentials.

Full durable mappings: [JSON](../../src/data/stripe-catalog.json) and [CSV](stripe-variant-mapping-2026-11-04.csv). Each includes product ID, sync variant ID, Printful catalog variant ID, Stripe Product/Price IDs, amount, currency, color and size. The manifest additionally scopes the mappings to account, mode and store.

## Settings audit

PASS means the stated narrow check succeeded, not that a payment was completed.

| Check | Status | Evidence / limitation |
|---|---|---|
| Application credential account association | PASS | Actual Hostinger key authenticated to acct_1T2CVABQlp4SmhNo; balance reported live mode. |
| Printful store association | PASS | Actual token can access store 18747907. |
| Stripe account activation / card capability | PASS | charges_enabled, payouts_enabled, details_submitted true; card_payments active; no current/past-due requirements. |
| Business website / support URL | PASS | Both identify hustlerdior.com. |
| Statement descriptor | PASS | HUSTLERDIOR; shortened prefix HUSTLER. |
| Merchant description / category | FAIL | Profile still references Crown And Concrete; MCC 5734 requires merchant review. No business identity or payout changes made. |
| Branding | UNKNOWN | Logo/icon and black/white colors configured; actual assets not visually approved. |
| Support email / phone | UNKNOWN | Values present; ownership, delivery and current accuracy not independently verified. |
| Receipt settings | UNKNOWN | No verified receipt configuration or delivery test. |
| Currency / catalog prices | PASS | Account default USD; 3,532 mapped Prices match source retail cents and USD. |
| Payment methods | UNKNOWN | Card, Apple Pay and Link enabled in listed configurations; Google Pay differs between configurations. Effective selection and wallet behavior untested. |
| Wallet merchant-domain registration | NOT APPLICABLE | Current flow redirects to hosted Stripe Checkout; no embedded Checkout/Elements or custom Checkout domain added. No hustlerdior.com payment-method-domain record exists. |
| Shipping implementation | PASS | Server permits US delivery, obtains fresh Printful estimate and passes quoted shipping to Checkout. No blanket delivery promise or free-shipping rule added. |
| Shipping rates / contribution margins | UNKNOWN | Destination-specific estimates and all-variant margin coverage are not established by catalog import; runtime quote/margin checks remain mandatory. |
| Existing automatic-tax configuration | FAIL | Host STRIPE_TAX_MODE=automatic; Stripe tax settings active but no active registrations. Current application requires an active registration. No registration or tax obligation was invented. |
| Success / cancellation URLs | PASS | Server code constructs same-origin order status and /checkout?cancelled=1 URLs. End-to-end redirects remain untested. |
| Stripe webhook configuration | PASS | Live endpoint we_1UIDPuBQlp4SmhNoRdYWTkWW enabled at /api/webhooks/stripe for completed, async succeeded, async failed and expired Checkout sessions. |
| Webhook signing-secret association / delivery | UNKNOWN | Host signing secret present; live secret-to-endpoint match and real event delivery not established. |
| PostgreSQL project / commerce tables | PASS | Host Supabase URL identifies cjhymlfmovmchwvpdoel; project healthy; hd_orders, hd_payment_jobs, hd_usage and hd_support_requests exist with RLS enabled. Tables had zero rows. |
| Application PostgreSQL connection | FAIL | DATABASE_URL absent in actual Host environment. Supabase API configuration does not establish the application's required PostgreSQL connection. |
| Authenticated retry worker | FAIL | CRON_SECRET and PAYMENT_WORKER_READY missing; no established production payment-worker schedule. Temporary import/estimate jobs are not payment workers. |
| Published merchant policies | FAIL | Live shipping, returns and terms pages return HTTP 200 but explicitly state owner approval is pending. Privacy and contact pages also return HTTP 200. |
| Sandbox separation / access | UNKNOWN | Correct Hustler Dior account exposes live access only. The other account's sandbox was not used. No sandbox catalog/orders/webhooks created. |
| Payment-to-fulfillment reconciliation | UNKNOWN | Live account listed zero Checkout Sessions; commerce tables empty. No completed payment available to reconcile. |
| Checkout activation | FAIL | CHECKOUT_ENABLED=true already existed, but DB, worker and policy gates remain false. No readiness flag was set. |

## Implemented changes and validation

Checkout now uses persistent Stripe Price IDs instead of inline price_data. It rechecks fresh catalog availability and prices, authenticated Stripe account, mode, store, Product metadata, variant IDs, currency, amount and billing shape. Shipping, margin, address and Printful sync-variant validation remain server-side. Missing or changed mappings fail closed. The payment worker reads variant metadata from the Price while preserving legacy inline-session compatibility.

The importer enumerates all pages, uses stable IDs and versioned lookup keys, retries safe provider operations, writes per-record checkpoints, recovers lost responses, and re-enumerates Stripe before publishing a complete mapping. A rerun can resume from Stripe records even if a local checkpoint is lost. It never deletes historical records or transfers lookup keys. Source exports must be complete, correctly scoped and no older than one hour.

The readiness script shares the runtime's six gates and checks actual authentication, database connectivity/tables, manifest account scope, webhook configuration, worker secret and existing automatic-tax requirements. Configured automatic tax now fails closed instead of silently falling back to untaxed checkout when its verification fails.

| Validation | Result |
|---|---|
| Unit tests | PASS — 84 |
| Server/database/authorization tests | PASS — 10, using fixtures and PGlite |
| TypeScript | PASS |
| ESLint | PASS — zero errors, one pre-existing GTM warning |
| Production build | PASS — next build --webpack && node scripts/prepare-standalone.mjs |
| Diff whitespace | PASS |
| Applied catalog rerun | PASS — 0 new Products, 0 new Prices, 3,532 matches, 17 unavailable skips |
| Stripe sandbox success / decline / cancellation | NOT RUN — correct-account sandbox unavailable |
| Real webhook replay / retry / fulfillment-failure recovery | NOT RUN — runtime DB/worker and sandbox prerequisites missing |
| Live test charge / paid Printful confirmation | NOT PERFORMED |

Automated tests cover signature tampering/expiry, event deduplication, worker lease fencing, unauthorized worker access, payment-proof tampering, wrong account/mode, changed Prices and idempotent mapping. These are not a completed Stripe sandbox purchase or production payment.

## Operations and remaining prerequisites

1. Configure a real app PostgreSQL connection securely in Hostinger; verify privileges, migrations, connectivity and recovery. Preserve every existing environment variable.
2. Configure a strong worker secret and authenticated schedule; test failed-job retries, lease expiry and reconciliation before setting PAYMENT_WORKER_READY=true.
3. Obtain test/sandbox access for this same Hustler Dior business, use isolated test credentials, catalog mappings, webhooks and order storage, and run success, decline, cancellation, replay and fulfillment-recovery tests.
4. Finalize actual shipping/return/sale terms and their owner approval. Set STORE_POLICIES_APPROVED only afterward.
5. Resolve the existing automatic-tax configuration with the merchant's actual tax position; do not invent registrations. Review stale merchant profile details and verify receipts/wallets.
6. Enable live checkout only after the above pass, then verify the live purchase entry point without charging a live test payment.

Reimport using existing authorized server credentials:

```sh
npm run catalog:stripe -- --account acct_1T2CVABQlp4SmhNo --mode live --apply --output src/data/stripe-catalog.json
npm run checkout:check
```

Use the same command with an explicitly authorized test account context and matching test key for sandbox mode. Never substitute another business's sandbox. The default importer reads Printful directly; --catalog accepts only a complete fresh storefront export that includes its verified storeId.

Before release, Hostinger's active build was 01a1a801-3e14-70a9-b907-32c5d919b989 at commit 7487a062f8ce6ab5360fa5f478479a7b7ac901e2. Rollback source is preserved in branch rollback/pre-stripe-catalog-20261104. Final release build/SHA and live smoke-test evidence are recorded in the integration pull request. Restoring source requires a supported redeployment; no unverified instant rollback control is claimed.
