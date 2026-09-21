# Hustler Dior — material and shopping refinements

Release prepared September 14, 2026, preserving the existing Next.js storefront, Printful catalog, cart, fulfillment safeguards, AI try-on interface, wholesale drafts, SEO/AEO work, and recovery tooling.

## What changed

- Photorealistic transparent signature tee replaces the illustrated opening asset, with fabric grain, seams, natural folds and rim lighting. The illustrated version remains a load-failure fallback. The 3.8-second entrance can be skipped, plays once per session and respects reduced-motion preferences.
- The campaign board responds gently to a mouse with damped perspective motion. Coarse pointers retain normal scrolling; reduced-motion users get a static composition.
- Real Printful product photos remain the product source of truth. Product cards show clickable color-image previews and the corresponding color's price range; color choice carries into product details.
- Image inspection supports click/tap zoom, mouse panning and an explicit zoom-out action. Changing a photo resets zoom.
- The Printful collection adds size and availability filters, searches color names, and provides a single clear-filters action. Multi-variant quick add reads “Choose your fit.”
- The Extended Edit at `/curated` contains the imported Shopify catalog, with separate IDs, a photo gallery, variant prices, original vendor labels and supplier descriptions. It has no Printful add-to-cart path.

## Shopify import

Connected source: `9t6qcq-0d.myshopify.com`. The authenticated export contains 46 products, 399 variants, 252 image references and 21 vendors. All product and nested variant/media pagination completed. Full supplier descriptions, HTML, image URLs, variant SKUs/options, inventory observations and source statuses are retained in `inventory/shopify-import.json`.

All 399 variants report `availableForSale=false`; product inventory is zero and `onlineStoreUrl` is null for all 46 products. The app therefore labels the Extended Edit as a catalog preview and does not accept orders for these products. `ACTIVE` is not proof that a product is published or available. This is a one-time import, not a background Shopify sync.

The public projection is produced with `npm run inventory:shopify`. The importer rejects incomplete pagination, mismatched variant counts, duplicate IDs and images outside the Shopify CDN. It excludes raw HTML and inventory internals from the public projection. Descriptions render as escaped text. Shopify GIDs are preserved and never converted to Printful numeric IDs.

Before Shopify checkout can be enabled: resolve actual supplier inventory and channel publication in Shopify, configure an authenticated runtime catalog connection, and implement Shopify-specific cart/checkout and fulfillment routing. Do not send these items to the existing Printful order endpoint.

## Validation at packaging

- Production build: passed; standalone assets prepared.
- TypeScript: passed.
- ESLint for modified modules: passed.
- 14 targeted commerce/import tests: passed, including complete 399-variant preservation, incomplete import rejection, unavailable inventory, category disambiguation, and rejection of Shopify IDs at the Printful checkout boundary.
- The generated WebP preserves alpha and is 1050 × 1050 pixels.

Browser interaction results and the latest deployment receipt are recorded in the standalone launch-status document after publishing. Payment, camera capture, paid AI generation and graphics-capable WebGL execution are not established by the build tests.

## Image asset record

Built-in image-generation tool; project asset: `public/brand/signature-tee-v2.webp`. Brand concept only; it is not a sale listing or an inventory variant. The generated PNG was converted to WebP and resized without changing its content; alpha is preserved.

Prompt: “Use case: product-mockup. Create a single photorealistic cutout asset for Hustler Dior's animated website brand intro. A black, boxy, heavyweight cotton streetwear t-shirt floating without a body or hanger, seen almost straight on with a slight natural three-quarter twist. Whole shirt centered, all sleeve and hem edges fully visible with generous margin. Real fabric weave, softly crumpled drape, stitched seams, ribbed collar, natural weight in the folds. On the chest the exact word HUSTLERDIOR in bold compact off-white sans-serif capitals, readable and spelled H U S T L E R D I O R; beneath it a very small line INDEPENDENT BY DESIGN. A small vermilion eight-point star lower on the torso, and a tiny red HD woven tab at the bottom right hem. Luxury product studio photography, soft light from upper left, subtle cool edge light, deep rich black cotton with discernible midtones. Transparent background with genuine alpha; no backdrop, no floor, no cast shadow outside garment, no person, no mannequin, no hanger, no unrelated brands, no external text. This is a brand concept illustration, not a sale listing. Output one square 1024px asset.”

## Primary domain

Publishing is authorized. Hostinger still assigns `hustlerdior.com` to the old Builder project, while the working Node.js app uses `lightgoldenrodyellow-snake-788114.hostingersite.com`. Both apex and www still serve a parked page. The previous supported alias attempt returned `Domain is already hosted`; the API exposes no safe Builder domain-release operation. No deletion, DNS change or repeat alias attempt is part of this release. The primary domain remains blocked until Hostinger releases/moves that assignment.

After assignment: apply the prepared primary URL/role/indexing environment, rebuild the exact source, and verify HTTPS, www routing, canonical metadata, catalog and cart. Keep payment and paid AI generation disabled until their actual production services are configured.

Sources: [Hostinger domain connection](https://www.hostinger.com/support/how-to-connect-a-custom-domain-to-a-node-js-application/), [Shopify product variants](https://shopify.dev/docs/api/admin-graphql/2026-07/queries/productVariants). Exact export fields were checked against the connected Shopify schema, and the query passed both schema and CLI validation.


## September 15 sales-flow enhancement

Added an editorial bag drawer, progress indicator, animated subtotal, direct add-on controls with explicit multi-variant selection, and photo-based checkout review with an Edit bag action. Product photos and stock/prices come from the refreshed catalogs. New controls preserve reduced-motion settings and keyboard operation. Optional items never enter a bag without an explicit add action.

The current release targets hustlerdior.com after the owner removed the blocking Builder assignment. All 23 selected tests, type checks, targeted lint and a clean production build passed. Inventory coverage and activation limits are detailed in INVENTORY-AND-SALES.md. Final deployment and browser verification are recorded separately after publishing.
