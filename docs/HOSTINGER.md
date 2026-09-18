# Deploy to Hostinger

The storefront requires a Node.js web app. A static `public_html` upload cannot run its API routes or protect Printful credentials.

Hostinger documents [ZIP and GitHub deployment for Node.js applications](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/) and [Next.js hosting](https://www.hostinger.com/web-apps-hosting/nextjs-hosting). Check the Node.js capability of the actual plan in hPanel; plan names and allowances can change.

## Current deployment status — September 15, 2026

The Next.js storefront is deployed on **https://hustlerdior.com/** on the existing Hostinger Node.js hosting plan. The primary domain serves the storefront over HTTPS, and www redirects to it. Search indexing is enabled for the primary catalog. The site includes 100 accessible Printful products and an Extended Edit containing the complete 46-product, 399-variant Shopify import.

The previous Builder assignment was removed by the owner, allowing supported Hostinger provisioning and deployment. Earlier references to a parked primary domain or the deleted temporary preview are historical and are superseded by this status. Domain mail records were preserved; Hostinger added an FTP record during provisioning.

**Catalog availability is not payment readiness.** Checkout and paid AI generation remain disabled while their runtime credentials, database, webhooks and operational checks are completed. All Shopify variants currently report unavailable and remain a catalog preview. See [Hustler-Dior-Hostinger-Launch-Status.md](Hustler-Dior-Hostinger-Launch-Status.md) and [GROWTH-RELEASE.md](GROWTH-RELEASE.md).

For an update, deploy the verified ZIP to the existing hustlerdior.com Node.js application. Do not create another website, alter DNS/mail records or reassign the domain.

## Run the exact source locally

Use Node.js 22 or 24 and npm.

```bash
unzip Hustler-Dior-Hostinger-Source.zip -d hustlerdior
cd hustlerdior
npm ci
cp .env.example .env.local
```

Open `.env.local` in your editor. Set the Printful token and store ID. The verified store ID is `18747907`. Keep `SITE_URL=http://localhost:3000` for local use. The API token is deliberately excluded from the source archive.

```bash
npm run dev
```

Visit `http://localhost:3000`. To inspect a catalog snapshot without live inventory calls, set `CATALOG_SNAPSHOT_PREVIEW=true` in `.env.local`. This is a visual preview: add-to-bag still verifies against the live product API, and checkout stays disabled until the payment runtime is configured.

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
4. Add runtime environment variables: `PRINTFUL_API_TOKEN`, `PRINTFUL_STORE_ID=18747907`, `PRINTFUL_SELLING_REGION=usa`, `SITE_URL=https://hustlerdior.com`, `CATALOG_SNAPSHOT_PREVIEW=false`. Keep the token server-only. Do not put the Hostinger API token in the app.
5. Build on a temporary Hostinger address first, then use the domain-connection flow to attach `hustlerdior.com` and enable HTTPS. During staging, set `SITE_URL` to the temporary app’s exact HTTPS origin so form requests use the correct allowed origin; canonical links continue pointing to the primary domain.
6. If hPanel says the domain is already assigned to an existing website, back up that site and resolve the assignment in the dashboard. Do not delete the hosting account or email service simply to attach this application.
7. Check `/api/health`, `/api/products?limit=2`, a product page and the shopping bag. Selected live Printful images render in the deployed preview; validate every image and server-side image retrieval needed by try-on before enabling inference.
8. Configure the PostgreSQL database, Stripe keys/tax settings, signed webhooks and scheduled payment worker described in `PAYMENTS-TRYON.md`. Set the image-generation credential and budget there as well before enabling Try On. Keep both service flags disabled until the deployed flows pass verification.

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

Keep `SITE_ROLE=preview` and `SEARCH_INDEXING=false` while reviewing the website. After the primary domain is ready, use `SITE_URL=https://hustlerdior.com`, `SITE_ROLE=primary`, `SEARCH_INDEXING=true`, and `CATALOG_SNAPSHOT_PREVIEW=false`, then rebuild/redeploy. Keep backup instances at `SITE_ROLE=backup` and `SEARCH_INDEXING=false`. See [SEO-AEO.md](SEO-AEO.md) for Search Console and live indexing checks and [RECOVERY.md](RECOVERY.md) for the included maintenance website and archive restoration.

## Payment worker and AI previews

See [PAYMENTS-TRYON.md](PAYMENTS-TRYON.md) for the database migration, Stripe webhook destination/events, a separately runnable bundled worker, signed sessions and image API configuration. The standalone output includes `payment-worker.mjs`, `migrate.mjs` and the schema directory. The source command `npm run orders:work` executes one bounded worker pass; schedule it reliably on infrastructure you control. Managed Hostinger worker/scheduler capabilities and request-timeout limits still need verification on the actual plan.

The AI image route can take up to 180 seconds. Validate that the selected host accepts this duration, or deploy a durable image-job service before enabling it. Product image delivery must work from the host. No paid GPU, model service or alternate website host was provisioned. The GitHub/Hugging Face research is in [AI-REVENUE-REVIEW.md](AI-REVENUE-REVIEW.md).
