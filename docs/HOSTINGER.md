# Deploy to Hostinger

The storefront requires a Node.js web app. A static `public_html` upload cannot run its API routes or protect Printful credentials.

Hostinger documents [ZIP and GitHub deployment for Node.js applications](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/) and [Next.js hosting](https://www.hostinger.com/web-apps-hosting/nextjs-hosting). Check the Node.js capability of the actual plan in hPanel; plan names and allowances can change.

## Current deployment status — September 21, 2026

The Next.js storefront is a **Hostinger Node.js 22** app on **https://hustlerdior.com/** (not Hostinger Ecommerce). Redeploy from this repository as a Node zip (`Hustler-Dior-Hostinger-Source.zip` layout: project files at the archive root). Printful is live via host env. The previous 100-piece “catalog preview” was a snapshot/single-page slice; this source paginates Printful until exhausted and keeps collection infinite scroll for the UI.

Checkout fields stay disabled, with explicit storefront copy, until a valid `STRIPE_SECRET_KEY` is present. Setting Stripe keys removes the preparing gate: shipping quotes, Stripe Checkout, the webhook, and Printful draft creation after payment. Do not invent secret values.

## Required Hostinger environment variables

Set these in hPanel on the existing Node app. Leave empty values empty until the provider issues them.

**Catalog (already used on the live host)**

| Variable | Notes |
| --- | --- |
| `PRINTFUL_API_TOKEN` | Preferred Printful token name used on the live host |
| `PRINTFUL_API_KEY` | Accepted alias if `PRINTFUL_API_TOKEN` is unset |
| `PRINTFUL_STORE_ID` | Numeric store id authorized by that token |
| `PRINTFUL_SELLING_REGION` | e.g. `usa` |
| `SITE_URL` | Exact public origin, `https://hustlerdior.com` in production |

**Checkout (not yet on the live host)**

| Variable | Notes |
| --- | --- |
| `STRIPE_SECRET_KEY` | `sk_test_…` / `sk_live_…` (or restricted `rk_…`). Enables quotes and hosted Checkout. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `https://hustlerdior.com/api/webhooks/stripe`. Needed to submit the Printful draft after payment. |
| `CHECKOUT_ENABLED` | Leave unset to enable checkout when Stripe is present. Set `false` to force the disabled UI. |
| `STRIPE_TAX_MODE` | Optional. `automatic` uses Stripe Tax when registrations are active; otherwise tax is left off and checkout still runs. |
| `SITE_URL` | Must match the browser origin used at checkout. |

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is **not required**. This storefront uses Stripe hosted Checkout, not Stripe.js.

**Optional**

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | PostgreSQL for durable quotes/jobs. When unset, quotes stay in process memory and paid orders recover from Checkout Session metadata. |
| `APP_SESSION_SECRET` | ≥32 characters. Falls back to `STRIPE_SECRET_KEY` when that key is long enough. |
| `CATALOG_SNAPSHOT_PREVIEW` | `true` is ignored whenever a Printful token is set. |
| `MIN_CONTRIBUTION_RATE` | Defaults to `0.35`. |

Do not put the Hostinger API token in the app. Do not commit `.env.local`.

## Run the exact source locally

Use Node.js 22 or 24 and npm.

```bash
unzip Hustler-Dior-Hostinger-Source.zip -d hustlerdior
cd hustlerdior
npm ci
cp .env.example .env.local
```

Open `.env.local` in your editor. Set `PRINTFUL_API_TOKEN` (or `PRINTFUL_API_KEY`) and `PRINTFUL_STORE_ID` from your Printful dashboard. Keep `SITE_URL=http://localhost:3000` for local use. Tokens are deliberately excluded from the source archive.

```bash
npm run dev
```

Visit `http://localhost:3000`. The snapshot flag (`CATALOG_SNAPSHOT_PREVIEW=true`) is a visual fallback only when no Printful token is set. Add-to-bag still verifies against the live product API when Printful is configured. Checkout stays disabled until `STRIPE_SECRET_KEY` is set.

For a production build:

```bash
npm run typecheck
npm run lint
npm test
npm run test:server
npm run build
npm start
```

The build creates a standalone Node server and copies its CSS, JavaScript and public assets. The preparation script removes local environment files from the standalone output.

## Hostinger ZIP deployment

1. In hPanel, choose **Websites → Add Website → Deploy Web App → Upload your website files**.
2. Upload `Hustler-Dior-Hostinger-Source.zip`. Its project files sit at the archive root. It contains no `node_modules`, build cache or API keys.
3. Select the **Next.js** framework. Use Node.js **22** or **24**. Set the installation command to `npm ci` and the build command to `npm run build` where those fields are available. The build output is `.next`. If an entry file is requested, use `.next/standalone/server.js`. The project’s `npm start` command starts that server.
4. Add runtime environment variables from the table above. At minimum for catalog: `PRINTFUL_API_TOKEN` (or `PRINTFUL_API_KEY`), `PRINTFUL_STORE_ID`, `PRINTFUL_SELLING_REGION=usa`, `SITE_URL=https://hustlerdior.com`. Keep tokens server-only. Do not put the Hostinger API token in the app.
5. Build on a temporary Hostinger address first, then use the domain-connection flow to attach `hustlerdior.com` and enable HTTPS. During staging, set `SITE_URL` to the temporary app’s exact HTTPS origin so form requests use the correct allowed origin; canonical links continue pointing to the primary domain.
6. If hPanel says the domain is already assigned to an existing website, back up that site and resolve the assignment in the dashboard. Do not delete the hosting account or email service simply to attach this application.
7. Check `/api/health` (includes `printful` and `checkout` booleans), `/api/products?limit=2`, a product page, the shopping bag, then `/#collection` until the collection count is the live Printful total rather than a 100-piece snapshot.
8. To collect payment, add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` on the same Node app and point Stripe at `https://hustlerdior.com/api/webhooks/stripe` (`checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`). PostgreSQL (`DATABASE_URL`) is optional on this Hostinger zip. See [PAYMENTS-TRYON.md](PAYMENTS-TRYON.md). Try On stays off until its own credentials are set.

Hostinger runs builds through its app deployment workflow; these npm commands are for your local checkout or build configuration, not instructions to run an unsupported shared-hosting SSH session.

## Register signed Printful webhooks

After the HTTPS app is reachable, run from the local project with `.env.local` pointing to the deployed `SITE_URL`:

```bash
npm run catalog:export
npm run webhooks:register
```

The registration script checks for existing configuration and refuses to overwrite it. It subscribes to stock updates for the verified catalog product IDs, plus catalog price updates. Copy the resulting public key and hexadecimal secret from `.env.webhook-secrets` into Hostinger’s runtime variables, then redeploy. Do not paste those values into GitHub or client-side code. Printful may retry deliveries during this short setup window.

Sync-product retail-price/name edits are covered by the five-minute API cache lifetime; v2 does not provide sync-product management. Re-run catalog export and review stock subscriptions when new underlying Printful catalog products are introduced.

## Optional Hostinger VPS container deployment

The included Dockerfile is for a Hostinger VPS you already control. It does not provision or purchase infrastructure.

```bash
docker build -t hustlerdior .
docker run -d --name hustlerdior --restart unless-stopped \
  --env-file .env.local -p 127.0.0.1:3000:3000 hustlerdior
```

Put a configured HTTPS reverse proxy in front of port 3000 and use the production domain for `SITE_URL`. Run one instance until the cache and order repository are shared across instances.

## Search and recovery configuration

`https://hustlerdior.com` is indexable without flipping `SEARCH_INDEXING`. Set `SITE_URL=https://hustlerdior.com` on that app. Keep backup instances at `SITE_ROLE=backup` (always noindex) and review other hostnames with `SITE_ROLE=preview`. A Printful token disables snapshot preview even if `CATALOG_SNAPSHOT_PREVIEW=true`. See [SEO-AEO.md](SEO-AEO.md) for Search Console and live indexing checks and [RECOVERY.md](RECOVERY.md) for the included maintenance website and archive restoration.

## Payment worker and AI previews

The application commits payment jobs when PostgreSQL is configured, and the Stripe webhook also runs fulfillment immediately so Hostinger Node deploys do not depend on a separate worker schedule. The standalone output still includes `payment-worker.mjs` for optional durable retries.

The AI image route can take up to 180 seconds. Validate that the selected host accepts this duration, or deploy a durable image-job service before enabling it. Product image delivery must work from the host. No paid GPU, model service or alternate website host was provisioned. The GitHub/Hugging Face research is in [AI-REVENUE-REVIEW.md](AI-REVENUE-REVIEW.md).
