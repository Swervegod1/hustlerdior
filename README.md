# HUSTLER DIOR — The Concrete Edit

A dark editorial streetwear storefront for **hustlerdior.com**, built with Next.js, TypeScript, Tailwind, Framer Motion, React Three Fiber, Drei, Three.js, Lenis and Zustand.

**Activation status (September 21, 2026):** this branch is the Hostinger Node zip storefront (not the older catalog-only GitHub scaffold). The live catalog paginates Printful until exhausted; the 100-piece snapshot is a fallback only when no Printful token is set. Stripe Checkout, shipping quotes, the webhook and Printful drafts after payment turn on when `STRIPE_SECRET_KEY` is present. Hostinger currently has Printful env vars and no Stripe keys — do not invent secrets. Redeploy as a Node 22 zip. See [Hostinger ZIP steps](docs/HOSTINGER.md).

## What is included

- Original interactive chrome HD pendant with pointer/scroll response, drag rotation and bloom.
- Magazine-style collection grid, perspective product cards, quick-add, sizes/colors, stock states, search and filters.
- Persisted shopping bag with quantity controls, accessible dialogs and optional synthesized sound.
- Server-only Printful integration, paginated catalog, validated variants, exact-cent retail prices and tagged cache.
- Signed v2 catalog-webhook handler and registration script.
- Live delivery quote flow, margin guard, Stripe hosted Checkout, signed payment webhooks and Printful draft creation after a verified payment (webhook-first; optional durable worker).
- HUSTLERDIOR T-shirt entrance; photo/camera Try On with consent, privacy controls, attempt limits and downloadable AI previews.
- Real optional “complete the look” add-ons and a researched GitHub/Hugging Face AI shortlist.
- Sanitized snapshot of **100 products / 2,444 variants** used only when Printful is not configured. Live stores paginate past that cap.
- Supplier shortlist, concrete wholesale product leads and a draft-feed validator.
- Hostinger ZIP instructions, standalone server, Dockerfile, strict TypeScript and commerce/security tests.
- Crawlable collection pages, visible fit/ordering answers, variant structured data, canonicals and a sitemap.
- Recovery archive tooling, a standalone maintenance website, and noindex controls for previews/backups.
- A repeatable Printful cost audit and a tested 35% contribution-margin price-floor calculator.

## Quick start

```bash
npm ci
cp .env.example .env.local
```

Set `PRINTFUL_API_TOKEN` or `PRINTFUL_API_KEY` in `.env.local`. Provision the private token securely; it is intentionally not included in source control. Set `PRINTFUL_STORE_ID` to the store authorized by that token and keep `SITE_URL=http://localhost:3000` locally.

```bash
npm run dev
```

Production commands:

```bash
npm run typecheck
npm run lint
npm test
npm run test:server
npm run build
npm start
```

For Hostinger, use Node.js 22 or 24, a Next.js Node web app, build `npm run build`, and the runtime entry `.next/standalone/server.js`. Set production environment variables in hPanel. See [complete Hostinger deployment steps](docs/HOSTINGER.md).

## API

| Route                                 | Behavior                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `GET /api/products?limit=12&offset=0` | Normalized live catalog and a pagination cursor; limit 1–100 |
| `GET /api/products/{id}`              | A normalized synced product and its variants                                         |
| `POST /api/checkout/quote` | Verifies prices/stock, quotes delivery, stores an owned expiring quote |
| `POST /api/checkout` | Creates Stripe hosted payment from the owned quote |
| `POST /api/webhooks/stripe` | Verifies signatures and submits the Printful draft after paid |
| `GET /api/orders/{id}` | Browser-owned order status, without recipient details |
| `GET/POST /api/try-on` | Checks service readiness / generates a consented image preview |
| `GET /api/recommendations` | Available complementary catalog products |
| `POST /api/webhooks/printful`         | Verifies signed v2 catalog events and invalidates cache                              |
| `GET /api/health`                     | Runtime health, plus `printful` / `checkout` booleans |

Printful sync products are still v1 resources. The project uses v2 for catalog availability and signed webhooks; it does not invent a `/v2/store/products` endpoint. See [architecture and commerce boundaries](docs/ARCHITECTURE.md).

## Files

The complete tree is in [docs/FILE-TREE.md](docs/FILE-TREE.md). Start with:

| File                                        | Purpose                                        |
| ------------------------------------------- | ---------------------------------------------- |
| `src/components/HeroScene.tsx`              | 3D chrome artifact and lighting                |
| `src/components/ProductCard.tsx`            | Tilt, reflection, product image and quick-add  |
| `src/components/Navigation.tsx`             | Header, cart badge and sound switch            |
| `src/components/ProductOptions.tsx`         | Real color/size selection and stock handling   |
| `src/stores/cart.ts`                        | Persistent, validated bag state                |
| `src/lib/server/printful.ts`                | Authenticated Printful requests and pagination |
| `src/app/api/products/route.ts`             | Public normalized catalog endpoint             |
| `src/app/api/checkout/route.ts`             | Validated checkout boundary                    |
| `src/lib/server/fulfillment.ts`             | Trusted captured payment to Printful draft     |
| `src/app/globals.css`, `tailwind.config.ts` | Design tokens and responsive layout            |
| `.env.example`                              | Server environment variable template           |

## Search, backups and pricing

See [SEO and AEO implementation](docs/SEO-AEO.md) and [backup/restore instructions](docs/RECOVERY.md). Preview and backup instances remain noindex. Enable search indexing only for the reviewed primary domain. Hidden keyword stuffing and duplicate ranking sites are not part of the implementation.

Run `npm run margin:audit` followed by `npm run margin:report` to estimate representative variant costs and create private pricing reports. The calculator targets 35% contribution before advertising and overhead, not guaranteed net profit. Confirm actual costs and margins before enabling an item for checkout.

## Wholesale

See [supplier research and import workflow](docs/WHOLESALE.md). S&S, Faire and BrandsGateway are candidates for expanded men’s/women’s collections. Jordan supply requires a real verified source and stock feed; no unverified sneaker listings were published. Your actual Printful retail prices were preserved.

## Validation and limitations

See [docs/VALIDATION.md](docs/VALIDATION.md) for measured results and remaining launch steps. The production build, type checking, commerce/SEO/margin tests and payment/photo/SQL checks passed. Hostinger built and served the app; selected live product images and cart interactions were verified. WebGL is disabled in the review browser, so full 3D motion still requires a graphics-capable device. No live payment or AI inference has been claimed.

The [multi-domain execution blueprint](docs/MULTI-DOMAIN-EXECUTION-BLUEPRINT.md) covers the proposed WooCommerce migration, domain routing, analytics, schema, offers, SMS and a gated 30-day rollout. Its executable templates are in `docs/blueprint/`. The connected domain portfolio contains .com, .cloud and .shop; .store control is unconfirmed. The blueprint does not silently change this app's commerce backend.

Product designs, imagery and brand identity remain the user’s assets. Third-party packages retain their own licenses. No product or artwork was created or altered inside Printful.

## Checkout, fitting room and AI research

Start with [PAYMENTS-TRYON.md](docs/PAYMENTS-TRYON.md) for migration and worker commands, tax prerequisites, private credentials, usage budgets and remaining live checks. [AI-REVENUE-REVIEW.md](docs/AI-REVENUE-REVIEW.md) compares Marqo-FashionSigLIP, Qwen3-Embedding, FASHN VTON 1.5 and CatVTON with source links and license findings. No Hugging Face model or GPU service was installed or purchased.

## Visual remix — September 14, 2026

A black/red/paper editorial redesign blends the supplied streetwear references, using real Printful product imagery. The flying tee, chrome scene, product tilt, variant selector, persistent bag, add-ons and camera/upload try-on interface are retained. See [the visual release record](docs/VISUAL-REDESIGN.md). The former temporary preview has been removed from the hosting account. The Builder assignment was cleared by the owner, and this release targets hustlerdior.com directly. Checkout and paid AI generation remain disabled as previously configured.


## Supplier inventory expansion

22 CJ/Trendsi buying drafts and 17 supplier photos are included alongside the existing S&S research. Run `npm run inventory:dropship`, then `npm run inventory:review` to build the private review catalog. See [docs/DROPSHIP-EXPANSION.md](docs/DROPSHIP-EXPANSION.md) for the supplier connections, pricing assumptions and activation sequence. These are draft records, not live inventory.

## September 15 inventory and sales release

See [INVENTORY-AND-SALES.md](docs/INVENTORY-AND-SALES.md) for exact access coverage and import commands. The working Printful token exposes one store (100 products / 2,444 variants). The other distinct supplied token returned HTTP 401. The Shopify refresh includes 46 products / 399 variants / 252 linked images; every variant is unavailable for sale at import time. The Extended Edit stays browse-only. New add-on controls require an explicit size/color selection when multiple options exist; bag quantities and prices remain validated server-side before payment.


## Attached streetwear catalog

The supplied [hustler-dior-streetwear-150.csv](inventory/hustler-dior-streetwear-150.csv) is attached to this hustlerdior.com source project. It contains 188 draft product records. See [attachment notes](docs/STREETWEAR-CSV.md) for its status and fields requiring verification before any storefront import.

## Private import inputs

Raw merchant exports and supplier image downloads are excluded from this public repository. Import scripts accept the corresponding local `inventory/` files. Parser tests use sanitized synthetic Shopify identifiers and public supplier-research fixtures; these are not inventory feeds. The storefront retains its normalized public catalog snapshots.
