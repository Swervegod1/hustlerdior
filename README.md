# Hustler Dior — The Concrete Edit

Independent graphic streetwear storefront. **Wear your own rules.**

- Brand: Hustler Dior / The Concrete Edit
- Creative direction: Swerve God
- Fulfillment: Printful (made-to-order)
- Payments: Stripe Checkout (hosted)
- Printful store: **18749826** (Hostinger catalog)
- Hosting: Hostinger Node.js (Next.js)
- Stack: Next.js App Router · TypeScript · React

## What's included

- Homepage with Concrete Edit streetwear vibe
- `/collection` — full Printful catalog (paginated, no 100/300 merchandising cap)
- `/product/[id]` — product detail, variant picker, add to bag
- `/bag` — cart → Stripe Checkout Session
- `/checkout/success` and `/checkout/cancel`
- `/guides` SSR content routes with FAQ JSON-LD
- `PrintfulClient` with mock fallback when Printful env is missing
- Header / ProductCard / Footer / bag components

## Guides

SSR guide pages (single H1 + FAQPage JSON-LD):

- `/guides` — index
- `/guides/tactical-luxury-streetwear-positioning`
- `/guides/veteran-owned-streetwear-brand-story`
- `/guides/concrete-edit-90s-bootleg-graphic-tees`
- `/guides/independent-streetwear-brands-2026`
- `/guides/made-to-order-dtc-buying-guide`

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local` locally. **Never commit secrets.**

### Environment

| Variable | Required to sell | Description |
|----------|------------------|-------------|
| `PRINTFUL_API_KEY` | Catalog + paid orders | Printful API token (Dashboard → Settings → API). Server-only. `PRINTFUL_API_TOKEN` is accepted as an alias. |
| `PRINTFUL_STORE_ID` | No (defaults) | Printful store ID. Default: `18749826` |
| `STRIPE_SECRET_KEY` | Checkout | Stripe secret key (`sk_test_…` or `sk_live_…`). Server-only. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No for hosted Checkout | Stripe publishable key (`pk_test_…` / `pk_live_…`). Safe to expose. Set it on Hostinger **before build** so it is inlined. |
| `SITE_URL` | Checkout redirects | Public origin, e.g. `https://hustlerdior.com`. Used for Stripe `success_url` / `cancel_url`. |
| `STRIPE_WEBHOOK_SECRET` | Auto-fulfillment | Signing secret for `POST /api/webhooks/stripe`. If unset, customers can still pay; Printful orders are not created automatically. |
| `CHECKOUT_ENABLED` | No | Set to `false` to pause Checkout even when Stripe keys exist. Default: enabled when `STRIPE_SECRET_KEY` is valid. |
| `CHECKOUT_ALLOWED_COUNTRIES` | No | Comma-separated ISO codes for shipping address collection. Default: `US`. |
| `STRIPE_SHIPPING_CENTS` | No | Optional fixed shipping amount in cents on the Checkout Session. Omit to charge product retail only. |

Leave `PRINTFUL_API_KEY` blank to run against built-in mock Concrete Edit drops. Mock drops **cannot** be paid for.

Leave `STRIPE_SECRET_KEY` blank to browse and bag items; `/bag` shows a clear “Stripe is not configured” state and the pay button stays off.

## Local run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
npm run lint
npm test
```

Do not place live charges while testing. Use Stripe test keys (`sk_test_…`) and [test cards](https://docs.stripe.com/testing) only if you intentionally exercise Checkout.

## Printful notes

- Store **18749826** is the Hustler Dior Hostinger catalog store.
- `src/lib/printful/client.ts` exposes `PrintfulClient.fetchCatalog()`, `fetchProduct(id)`, and `resolveCheckoutLines(items)`.
- Catalog lists `GET /store/products` with **limit 100** (Printful’s max) and walks `paging` until the store is exhausted. Ignored products are skipped. There is no 100- or 300-product merchandising cap. A safety offset of 10,000 exists only to stop a broken loop.
- List prices stay “From collection” until the PDP loads `/store/products/{id}` and reads `sync_variants` retail prices.
- Checkout **never trusts bag prices**. The API re-fetches Printful variants and sends `price_data.unit_amount` to Stripe.
- If the API key is missing or the API errors, the client returns mock products so the UI stays usable.

## Stripe notes

Flow: **Bag → `POST /api/checkout` → hosted Checkout Session → success URL**.

- Server creates a [Checkout Session](https://docs.stripe.com/checkout/quickstart) in `payment` mode with Printful-verified line items.
- Shipping address and phone are collected on Stripe.
- `GET /api/checkout` returns `{ configured, publishableKeySet, message }` for the bag UI (no secrets).
- `GET /api/health` reports whether Printful and Stripe keys are present (boolean only).
- Point Stripe webhooks (Dashboard → Developers → Webhooks) at `https://hustlerdior.com/api/webhooks/stripe` for `checkout.session.completed` if you want automatic Printful draft/order creation after a paid session.

## Deploy on Hostinger (Node.js)

This app is a **Node.js** Next.js site (server components + `/api/*`). A static `public_html` upload cannot run checkout or hide Printful/Stripe secrets.

1. Connect this GitHub repo (or upload a source ZIP with files at the archive root). Use the existing hustlerdior.com Node.js application — do not create a second site just to ship a catalog fix.
2. Framework: **Next.js**. Node.js **20+** (22 or 24 preferred).
3. Install: `npm ci` (or `npm install` if a lockfile is not used).
4. Build: `npm run build`
5. Start: `npm start` (Hostinger Next.js preset is fine). If an entry file is required, Hostinger’s Next adapter typically uses the build output; do not point the process at a static export.
6. In the Hostinger environment panel set at least:
   - `PRINTFUL_API_KEY` — Printful token (**secret**)
   - `PRINTFUL_STORE_ID=18749826`
   - `STRIPE_SECRET_KEY` — Stripe secret (**secret**)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — set **before** the build so Next can inline it
   - `SITE_URL=https://hustlerdior.com`
   - `STRIPE_WEBHOOK_SECRET` — after the webhook endpoint is registered
7. Rebuild/redeploy after changing `NEXT_PUBLIC_*` variables.
8. Confirm:
   - `/collection` shows the full live drop count (not stuck at ~100)
   - `/api/health` → `printful: true`, `stripe: true`
   - `/bag` pay button is enabled when Stripe is configured
9. Point domain DNS at Hostinger and keep HTTPS on. Set `SITE_URL` to the exact public origin Checkout will redirect to.

For static-export-only plans, use a Node runtime host instead. Catalog fetch and Checkout Sessions are server-side.

## License

Private brand scaffold for Hustler Dior / Swerve God.
