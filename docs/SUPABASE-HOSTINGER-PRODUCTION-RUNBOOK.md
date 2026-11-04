# Hustler Dior — Supabase Postgres and Hostinger production activation

> **Not an instruction to turn on payments immediately.** Complete the gates below in order. No production credentials belong in GitHub or chat.

## What Hostinger currently has

- Hostinger Node.js app `hustlerdior.com` uses Next.js, `pg` (node-postgres) and `DATABASE_URL` for checkout/order persistence.
- Hostinger's **Supabase connector** currently exposes `SUPABASE_URL` and `SUPABASE_API_KEY`. These support the Supabase REST/JS API, **not** the database SQL connection expected by the existing `pg` pool. Do not install `@supabase/supabase-js` simply to claim checkout persistence works.
- Hostinger also has a **separate MySQL database** named `u656718443_New`. It is **not** a replacement for PostgreSQL and should not be pointed at the `pg` client.
- Hostinger's masked Node env inventory has no `DATABASE_URL`, `PAYMENT_WORKER_READY`, `STORE_POLICIES_APPROVED` or `CRON_SECRET`. No Hostinger account cron jobs are listed.
- GitHub PR #15 has passed typecheck, lint, tests, server tests, build and the high/critical production audit (run 41751812609).

## 1. Verify *which* Supabase project is connected

In the **authenticated** Supabase project dashboard, open Connect and choose **Postgres connection string → Session pooler** (IPv4-compatible if needed), or the provider's recommended application-pooling mode. Confirm it belongs to the database you want to use for **this storefront**, not a different project.

The supplied connection string should have PostgreSQL semantics, e.g. `postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require`. Use the actual URL from your own provider, including the correct user, project reference, password, port and TLS settings. **Do not invent it and do not use `SUPABASE_URL` or `SUPABASE_API_KEY` as the Postgres URL.**

Record a secure owner-held copy of credentials outside the repository. The Node `pg` pool is configured to validate certificates; do not disable TLS validation or add `rejectUnauthorized:false`.

## 2. Back up before migration and deployment

1. In an authenticated Hostinger **hPanel → Websites → hustlerdior.com → Backups**, verify a dated **downloadable and restorable copy** of the current live Node app, source, settings, and other required customer data. The existing September 22 deployment archive referenced by Hostinger returned HTTP 404 when queried from the connected API, so **it is not verified as a rollback artifact**.
2. In Supabase, verify project backups/PITR or take a provider-supported consistent SQL export **before** applying schema changes; protect it independently of Hostinger. No production database content should be overwritten.
3. Verify rollback actually can restore the previous Node app and external PostgreSQL data. A Git tag alone is **not** a database backup. Store the rollback instructions and artifact identifiers privately.

## 3. Configure PostgreSQL and schema

- In **hPanel → Node.js app → Environment variables**, add `DATABASE_URL` as the provider-issued PostgreSQL connection string. **Do not use Hostinger `hosting_databases_setup-website`** for this codebase: that creates a MySQL connection and may replace env config.
- **Preserve every current secret.** The Hostinger API `replace-environment-variables` call replaces the entire set; it returns existing values masked and therefore cannot safely add just one variable. Use authenticated hPanel rather than overwriting masked secrets.
- With Supabase SQL Editor connected to the correct project, review and apply `database/001-commerce.sql` and `database/002-support.sql` only after the database has been backed up. Both scripts use PostgreSQL syntax (`uuid`, `jsonb`, `timestamptz`) and create tables/indexes only if missing. Review conflicts and preexisting data; do not run migrations against an unknown production project.
- Verify tables `hd_orders`, `hd_payment_jobs`, `hd_usage`, `hd_support_requests` and access grants for the configured app user. A real read/write transaction and rollback test must pass (in a test schema or an isolated test database).

## 4. Secure and operate payment-job processing

- `src/app/api/internal/payment-worker/route.ts` requires `Authorization: Bearer <CRON_SECRET>`, minimum 32 characters, and performs one bounded queue pass per invocation. The secret stays server-side and must never be embedded in a public URL or application code.
- Schedule a **server-side, authenticated** cron service capable of sending an Authorization header to `https://hustlerdior.com/api/internal/payment-worker` periodically, or run the existing Node worker process `scripts/payment-worker.ts` on controlled infrastructure using the exact same database. The Hostinger cron listing is empty; simply adding `CRON_SECRET` does not create a schedule.
- Verify worker lease/claim, retry/idempotency and error monitoring against test-mode Stripe events and *mocked* Printful drafts. Keep `PRINTFUL` order confirmation disabled; the existing code posts `confirm=false` and requires owner-reviewed production authorization.
- Reconcile any existing Stripe completed sessions, their order IDs, captured payment IDs, internal order rows and Printful draft IDs before enabling payment. Inspect actual provider records; do not assume no orders simply because database keys are absent.

## 5. Approve final customer policies and rights

- Draft routes `/shipping`, `/returns`, and `/terms` are placeholders for verified owner-approved terms, **not final binding terms**. Record the approved timing/regions, returns/refunds and damaged-item handling, cancellation windows, responsible shipping costs, support SLA and any legally required disclosures. Update the pages and re-run CI.
- Review rights/licensing on imagery, brand references, hero product IDs and any models or collaboration graphics. Do not enable unapproved paid tiers, promotions, scarcity or automatic fulfillment charges.

## 6. Payment readiness is fail-closed

Only when each independent prerequisite above is tested and approved should the owner/operators consider these **in hPanel**:

| Key | When to set |
| --- | --- |
| `DATABASE_URL` | After the correct Postgres project, URL, TLS and schema are verified |
| `CRON_SECRET` | After generating a unique secret and deploying a compatible authenticated worker |
| `PAYMENT_WORKER_READY=true` | After worker runs, retries, alerts and reconciliation are verified |
| `STORE_POLICIES_APPROVED=true` | After exact on-site terms have owner approval |
| `CHECKOUT_ENABLED=true` | **Last**, after Stripe **test-mode** checkout/webhook and mocked Printful tests, with production payment readiness explicitly authorized |

The code also requires a valid Stripe key, a configured Printful store and `DATABASE_URL` before checkout can open. **Do not mark readiness flags true simply to make a payment button show.**

## 7. Deploy only after restoration and test verification

- PR #15 remains draft until all gates are met.
- Configure Hostinger GitHub installation and validate the branch, or upload a clean Node.js source ZIP (without secrets, `node_modules`, or build output). Hostinger's current production source is an archived ZIP, not an active Git deployment; **merging a pull request alone does not publish it**.
- Once final staging tests pass and the rollback is verified, deploy to `hustlerdior.com`. Verify `/api/health`, product pages, cart, delivery quote in **safe test mode**, Stripe webhook signature handling, queued order-to-Printful draft creation and monitored worker. Preserve existing customer data and Printful credentials.
- If any production smoke check fails, roll back from the **verified** Hostinger backup and follow the documented data recovery plan. Never attempt a trial live customer charge or place a real Printful order merely to test a deployment.

## Status

**Production deployment NOT CLEAR.** This runbook cannot itself verify an authenticated Hostinger backup, produce a provider-issued PostgreSQL URI, approve store policies, or certify production worker health.
