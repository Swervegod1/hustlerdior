# Checkout activation and Vercel migration

Status: prepared source, not a live Vercel deployment. Keep the current Hostinger DNS until a replacement is built and verified.

The GitHub `main` branch inspected on 2026-09-18 contained an older catalog scaffold, no checkout routes, and a `PLACEHOLDER` guide module. This branch restores the saved Hostinger storefront and its payment implementation. Previous GitHub files remain recoverable from the parent commit.

## Hosting

The connected Vercel team uses Hobby. Commercial use requires a suitable paid plan, and the included one-minute worker schedule requires Pro or Enterprise. No plan has been purchased. See https://vercel.com/docs/plans/hobby and https://vercel.com/docs/cron-jobs/usage-and-pricing.

Import this branch into the selected commercial Vercel team as a Next.js project. `vercel.json` builds Next directly; Hostinger's standalone build remains available through `npm run build`.

## Exact server environment

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | `https://hustlerdior.com`; exact origin used for request verification and payment return URLs |
| `SITE_ROLE` | `primary` only on the primary production domain |
| `SEARCH_INDEXING` | `true` only on the primary production domain |
| `PRINTFUL_API_TOKEN` | Private Printful token for the source store. `PRINTFUL_API_KEY` is accepted if this is unset. |
| `PRINTFUL_STORE_ID` | Store actually authorized by the token; retain the verified production value |
| `DATABASE_URL` | Optional pooled Postgres URL. Hostinger zip deploys can run without it. |
| `APP_SESSION_SECRET` | Optional cryptographically random secret, at least 32 characters; falls back to `STRIPE_SECRET_KEY` |
| `STRIPE_SECRET_KEY` | Restricted runtime Stripe key with customer/session writes and payment/charge/tax reads |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for this site's Stripe destination |
| `STRIPE_TAX_MODE` | Optional `automatic`; missing Stripe Tax does not block checkout |
| `CRON_SECRET` | Separate cryptographically random secret, at least 32 characters |
| `CHECKOUT_ENABLED` | Leave unset to enable checkout when Stripe is present; set `false` to force the disabled UI |

This application uses neither NextAuth nor client-side Stripe Elements. `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL`, and a publishable Stripe key do not unlock checkout. The Printful variable is `PRINTFUL_API_TOKEN`; `PRINTFUL_API_KEY` is an accepted alias for Hostinger hosts that already use that name.

Preview deployments must have separate test Stripe credentials and a development database branch. Set `SITE_ROLE=preview`, `SEARCH_INDEXING=false`, and leave live checkout disabled. Never copy production secrets into public files, build artifacts, or pull request descriptions.

## Database

The source uses `pg` and numbered SQL migrations, not Prisma. Run `npm run db:migrate` with the chosen database's credentials. The four tables are `hd_orders`, `hd_payment_jobs`, `hd_usage`, and `hd_support_requests`. A new free-plan Neon project and an isolated validation branch have been provisioned; both schemas were applied and inspected using the Neon connector. Do not run `prisma db push` against this application.

## Webhook and fulfillment

Destination: `https://hustlerdior.com/api/webhooks/stripe`.

Required events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`. `payment_intent.succeeded` alone does not drive the session-based worker and is deliberately ignored by this handler.

Match the source's pinned API version. Install the secret before enabling delivery. The handler commits an idempotent job before acknowledging the event. A signed request to `/api/internal/payment-worker` runs a bounded worker pass; Vercel supplies `Authorization: Bearer CRON_SECRET`. Monitor queued jobs and increase worker capacity with measured demand.

The worker verifies captured funds, order identity, amounts, delivery address and tax before creating a deduplicated Printful draft. Draft creation is not automatic paid production confirmation. Review and confirm drafts operationally until a separately verified production-confirmation integration is implemented.

## Activation order

1. Build and test this branch; provision a permitted hosting plan without moving the domain.
2. Set exact runtime secrets securely. Set the true production `SITE_URL`; keep the feature flag off.
3. Run migrations and `npm run checkout:check`. Resolve missing tax settings and catalog margin failures.
4. Configure the signed webhook and scheduled worker. Validate a sandbox payment, delayed payment, duplicate event and fulfillment retry with test credentials.
5. Assign the three custom domains on the destination. Use the records returned for this project rather than assuming an old shared IP.
6. Snapshot current DNS; preserve MX, SPF, DKIM and DMARC. Configure HTTPS 301 redirects for `.shop` and `.cloud` after checking existing paths. A CNAME is a hostname alias, not an HTTP redirect and cannot contain `https://`.
7. Enable checkout only after verification; then verify live availability and the hosted payment screen without submitting a charge. Monitor the first real customer order through final fulfillment.

The runtime key cannot be retrieved from the Stripe connector. A merchant must provision it securely in the hosting secret manager. Connected Stripe account access alone does not inject credentials into Next.js.
