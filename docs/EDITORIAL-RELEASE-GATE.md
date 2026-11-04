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
3. Owner must approve explicit shipping / returns / terms / support facts. Current `/shipping`, `/returns`, `/terms`, `/contact` were 404 in the November 3 audit. These pages remain out of scope for unapproved publication.
4. Verify persisted production DB and payment-worker schedule, draft review owner, exception alert and idempotency.
5. Validate rights/license status of featured products and any future model-in-context assets. No model imagery was supplied; the hero reuses existing catalog product assets.
6. Verify full fulfillment and Stripe **test-mode** regression with mocked Printful approval, then browser QA on touch and keyboard.
7. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:server` and `npm run build`; inspect CI and staged page screenshots.
8. Only then deploy to `hustlerdior.com`; perform post-release `/api/health`, product page, cart, quote, webhook and monitoring checks. No unapproved live payment or fulfillment changes.

**Release status:** NOT CLEARED until every blocking requirement is verified. CI alone does not clear the production gate.
