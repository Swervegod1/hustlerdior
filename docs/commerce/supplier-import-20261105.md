# Supplier import and order routing — 2026-11-05

Status: staged private drafts only. No live products, orders, purchases, email sends or payout changes.

Confirmed merchant choice: purchase alerts to hustlerdior@gmail.com; proceeds remain in Hustler Dior LLC's existing Stripe balance and payout account (acct_1T2CVABQlp4SmhNo).

## Catalog evidence

42 source product/colorway records; 718 variant/option rows, including 611 supplier variant IDs plus 49 Wordans color/size ID pairs. Source page observations are not a guaranteed stock reservation or account-specific landed cost. Preserve exact men's/women's labels, one-colorway sneaker SKUs, all observed options, and source stock flags. Do not create cross-products of sizes/colors from unrelated controls.

The 26 submitted links in the attachment contain 25 unique URLs. Of those, 15 have source records, 1 matches the prior MUSINSA product, 2 are DTF Jersey color duplicates, and 7 need an exact merchant/product match. Source coverage is explicitly partial for unresolved matrices and linked additional colors.

The external records do not belong to Printful. Existing Printful catalog, variant IDs, checkout, prices and SEO routes remain unchanged.

## Required paid-order flow

1. Authoritative server-side catalog and stock/landed-cost validation; approve retail amounts and shipping before publication.
2. Create a durable order snapshot with supplier URL, exact supplier variant ID/SKU, size, color, quantity, retail amount/currency and delivery details. Split external and Printful fulfillment.
3. Create Checkout in the verified Hustler Dior Stripe account. Separate test/live snapshots.
4. Signed Stripe webhook plus server-to-server payment verification must confirm captured payment, order ownership, currency/amount and no refund/dispute. Browser redirects cannot authorize fulfillment.
5. Within a DB transaction, insert one manual purchase task and one email outbox entry per order/supplier with a unique key. Email to hustlerdior@gmail.com includes order reference, item/size/color/quantity and exact supplier purchase link. Use an authenticated admin order view for delivery details.
6. Email requires a deployed transactional provider credential and authenticated worker. Use provider idempotency, bounded retries, a dead-letter state and manual reconciliation for ambiguous send outcomes. Replays must not duplicate purchase tasks or emails.
7. Merchant buys the correct items and records supplier order ID and shipment tracking. Creating an email/task is not fulfillment. Do not automatically spend money at a linked retail checkout.
8. Customer proceeds follow the existing Stripe settlement/payout configuration. No new wallet, transfer, payout destination or live test charge.

## Current blockers

- DATABASE_URL missing in Hostinger
- CRON_SECRET and PAYMENT_WORKER_READY missing
- STORE_POLICIES_APPROVED missing
- No application transactional email credentials configured
- External supplier checkout/fulfillment adapter not implemented
- Hustler Dior retail prices and landed costs not verified
- Some exact merchant links and full variant matrices unresolved
- Firecrawl connected-app credit allowance exhausted; no credits purchased

Both Remote Desktop Commander devices were offline. Hostinger currently exposes only masked values through its full-replacement environment API; never write masks back. Its current env key list confirms no DATABASE_URL, CRON_SECRET, PAYMENT_WORKER_READY, STORE_POLICIES_APPROVED or transactional email credential.

The repository order schema and worker currently validate Printful variants and create Printful drafts. External supplier checkout, manual fulfillment task storage and transactional email dispatch are not implemented or deployed. The staging script is not a payment integration.

## Phases and rollback

1. Private draft import: validate and idempotently merge source observations; preserve merchant decisions and unrelated rows. This phase is implemented by scripts/stage-supplier-import.mjs.
2. Resolve held sources/variants and approve account costs, retail prices, shipping/returns and supplier image usage.
3. Implement external catalog adapter, mixed-cart verification, durable manual-task/outbox tables, authenticated task view and email transport. Keep external sales off.
4. Connect existing PostgreSQL safely and configure worker/email without replacing secrets. Test sandbox success, decline, cancellation, tampered payment, replay, expired stock, email timeout/retry and duplicate suppression.
5. Enable external products and checkout only after independent readiness passes.

Rollback: draft import does not change the public catalog. Retain the prior private queue file before refresh. For later deployment, disable external sales first, restore the last healthy release, and preserve paid-order/task/outbox data for reconciliation; never delete or recreate payment history.
