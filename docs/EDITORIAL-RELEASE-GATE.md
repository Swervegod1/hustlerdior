# Hustler Dior — editorial storefront release gate

## Scope implemented on a feature branch
- Full-bleed art-directed product lookbook hero, current-product links, mobile layout and seasonal editorial
- Accessible native `details` releases mega-menu, mobile release links and accessories collection
- Real-stock sold-out badge; quick-size selection with server-side variant/price revalidation retained
- Discount percentage and comparison price displayed **only** if an authoritative compare-at price exists. No invented sale, limited quantity or launch date
- Opt-in approved-datetime countdown via `NEXT_PUBLIC_APPROVED_DROP_AT`; TBA without one
- PDP alternate view thumbnail rail, existing zoom/fit guide and mobile sticky add-to-bag
- No membership, raffle, SMS, cart email or automatic price changes

## Blocking P0 release requirements
1. Verify Hostinger rollback artifact and a dated **database and files backup**. A Git commit is not a backup of live data; current Hostinger server deployment is from a September 22 archive.
2. Record current deployed SHA / build contents and reconciliation of paid Stripe events to internal paid orders and Printful drafts. Do not send production orders or replay live webhooks as a test.

   **Confirmed November 3 Hostinger data:** website `hustlerdior.com`, username `u656718443`, Node 22 / Next.js, last build from `Hustler-Dior-Hostinger-Source.zip` on September 22, 2026. The running production SHA is **unknown** because the deployment source is an archive, not Git; do not claim that main/branch code matches production. The current masked environment-key inventory does **not** contain `DATABASE_URL`; the Hostinger account cron-job list is empty. Neither confirms absence of an external database or worker, but a durable payment-to-fulfillment pathway is **not verified**. This deployment blocker must be resolved before release.
3. Owner must approve explicit shipping / returns / terms / support facts. Current `/shipping`, `/returns`, `/terms`, `/contact` were 404 in the November 3 audit. These pages remain out of scope for unapproved publication.
4. Verify persisted production DB and payment-worker schedule, draft review owner, exception alert and idempotency.
5. Validate rights/license status of featured products and any future model-in-context assets. No model imagery was supplied; the hero reuses existing catalog product assets.
6. Verify full fulfillment and Stripe **test-mode** regression with mocked Printful approval, then browser QA on touch and keyboard.
7. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:server` and `npm run build`; inspect CI and staged page screenshots. GitHub Actions run 41744829545 failed **before any runner was assigned** (runner ID 0, no steps, zero compute milliseconds); this is not evidence that TypeScript/lint/tests failed. GitHub runner allocation/permissions/status must be checked and CI rerun until there is a real passing test job.
8. Only then deploy to `hustlerdior.com`; perform post-release `/api/health`, product page, cart, quote, webhook and monitoring checks. No unapproved live payment or fulfillment changes.

**Release status:** NOT CLEARED until every blocking requirement is verified. CI alone does not clear the production gate.

## CI diagnostic note — November 3 / November 4, 2026
- Re-running the previous failure and pushing the follow-up branch commit both led to pre-run GitHub Actions job failures: no runner attached, no executable steps, no compute time.
- Do **not** report this as a passing or failing code-level test. Open [the repository Actions page](https://github.com/Swervegod1/hustlerdior/actions), inspect the verify job's prominent error banner, then check repository Actions permissions and applicable GitHub account restrictions. Do not assume a billing issue for a public repository; standard Linux runners are generally free for public repositories.
- Updated the workflow to avoid duplicate push + PR jobs and allow workflow_dispatch. New feature commits should only run the PR job.
- If no GitHub Actions runner can start, execute `npm ci && npm run typecheck && npm run lint && npm test && npm run test:server && npm run build` in an authorized Node 22 environment and retain raw logs, **then** separately restore GitHub CI before production promotion.
- Never deploy merely to test whether the build succeeds.

## Featured artwork rights gate
The hero's production asset is not automatically selected from a potentially rights-sensitive catalog. A rights-cleared product may be featured **only after documentation and owner approval** via `APPROVED_EDITORIAL_FEATURE_PRODUCT_ID` or `APPROVED_EDITORIAL_SECONDARY_PRODUCT_ID`, using current catalog product IDs. Without approval, the hero shows typographic editorial treatment (no unverified product endorsement). This is a release-safety gate, not a substitute for a complete catalog IP review. Existing product pages are not modified in this branch.
