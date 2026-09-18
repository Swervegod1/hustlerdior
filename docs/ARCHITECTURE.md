# Architecture and commerce boundaries

## Runtime

Next.js 16 App Router on Node.js. TypeScript strict mode, Tailwind 3 custom tokens, Framer Motion, React Three Fiber, Drei, Three.js, postprocessing, Lenis and Zustand. React is pinned to the compatible 19.2 release line because the installed Fiber package excludes React 19.3. All exact dependency versions are in `package.json` and `package-lock.json`.

Page data is rendered on the server. `connection()` defers environment-dependent rendering until request time while allowing tagged upstream fetch caching. The 3D scene loads in a separate client bundle. Catalog browser requests paginate independently of the first rendered grid; product cards display in groups of twelve.

## Printful versions

The [official v2 documentation](https://developers.printful.com/docs/v2-beta/) says sync products and product templates are not available in v2. This project therefore uses a deliberate compatibility boundary:

| Capability                                     | Resource                                             |
| ---------------------------------------------- | ---------------------------------------------------- |
| Existing store product list                    | `GET /store/products?limit=…&offset=…&status=synced` |
| Existing design/variant detail                 | `GET /store/products/{id}`                           |
| Regional catalog availability check            | `GET /v2/catalog-variants/{id}/availability`         |
| Signed catalog events                          | `/v2/webhooks`                                       |
| Draft orders retaining existing synced artwork | `POST /orders?confirm=false` with `sync_variant_id`  |

The v2 API is documented as beta. A full v2 order adapter must explicitly map the design’s catalog variant, printing technique, placements, layer files and options. Substituting a sync variant ID into a v2 catalog order would be incorrect and could produce the wrong item. The current draft helper keeps the existing synced design through v1.

## Catalog

`src/lib/server/printful.ts` adds the bearer token and store header server-side. The base URL is fixed; request paths are constructed from validated values. Credentials, artwork source files, internal SKUs and private account data are not sent to the browser. Product details are normalized through Zod.

Prices are integer cents derived from the existing retail-price strings. Zero/malformed prices and unsynced/ignored variants are excluded. Each product has one currency; a mixed-currency bag is rejected. Store stock states become available, out of stock, discontinued or unknown. Unknown states are not purchaseable. Categories and gender filters are conservative name-based merchandising heuristics; an admin override table is a sensible next step when the actual taxonomy is defined.

Upstream reads cache for five minutes under `printful-catalog`. The public JSON response is not separately CDN-cached, so a signed event can expire the data tag without a second stale-response layer. Concurrent detail reads are capped at three. Transient provider failures return a clear unavailable state, with no fabricated inventory. Refresh the sanitized snapshot using `npm run catalog:export`; it is a preview artifact, never proof of current availability.

The first collection query and every pagination call use the real API. The source snapshot contains 100 actual products and 2,444 variants from the verified store, including unavailable variants so the option selectors can show them honestly.

## Cart, checkout and orders

Zustand persists the bag only. Rehydration validates stored values, drops duplicate IDs and rejects incompatible currencies. Browser totals are estimates: local storage is untrusted. Sound starts off each session and is synthesized only after a user gesture.

The checkout page collects a US delivery address. `/api/checkout/quote` verifies the cart, quotes actual Printful fulfillment/shipping costs, applies the configured margin guard, and stores an immutable order snapshot in PostgreSQL. `/api/checkout` accepts only an expiring quote ID bound to the signed browser cookie, then creates an idempotent Stripe-hosted Checkout Session. Tax prerequisites are checked server-side; delivery uses the quoted address.

Stripe webhooks verify raw signatures and commit deduplicated work before acknowledgement. The standalone worker retrieves Stripe payment proof, rejects mismatched amounts/variants/addresses and refunded or disputed payments, and creates a deduplicated Printful draft. The SQL queue supports retries, leases and fencing tokens. Production confirmation remains an operator action. See [PAYMENTS-TRYON.md](PAYMENTS-TRYON.md) for exact runtime variables, migrations, worker commands and launch limitations.

## AI fitting room

`TryOnButton.tsx` lazy-loads the fitting-room dialog only when opened. Photo upload/camera capture and consent precede generation. `/api/try-on` validates origin, session, body size, MIME and decoded dimensions; removes image metadata; fetches an allowlisted garment reference; and requests one OpenAI image edit. Shared database counters limit attempts. Images are not written to the application database or logs. The feature is disabled until its runtime key and budget are configured.

## Webhooks

The Printful catalog handler reads raw request bytes, identifies the configured public key, decodes the hexadecimal secret, checks HMAC-SHA256 with a timing-safe comparison, and checks the store ID. It does not assume a Stripe-style signature header or reserialize JSON before verification.

It handles catalog stock and catalog price events through cache invalidation only. Repeated events are harmless; no order or email is created. Printful retries for hours, so the handler does not apply an arbitrarily short timestamp rejection window. Stripe payment processing uses its own signed endpoint and durable queue. Printful shipment-event processing remains future work.

## Interactive design

`Arrival.tsx` provides the skippable, reduced-motion-aware HUSTLERDIOR shirt entrance. `CompleteTheLook.tsx` offers real optional complementary products with explicit size/color selection.

`HeroScene.tsx` constructs an original chrome pendant from beveled Three.js geometry, studio Lightformers, environmental reflections and bloom. Cursor position and scroll velocity modulate rotation; OrbitControls handles drag. The artifact is a decorative concept, not a promised item for sale. Off-screen canvases use demand rendering, pixel density is capped and WebGL failure has a typographic fallback.

`ProductCard.tsx` uses spring-driven perspective tilt, image parallax, grain and a moving radial reflection. Quick-add opens real variant choices where needed. `Navigation.tsx` shows the bag count and audio switch. The custom pointer supplements the native pointer. Reduced-motion preferences disable nonessential motion, and coarse pointers do not get cursor effects. Radix dialogs provide focus management and Escape handling.

Product image URLs are the original Printful previews. This environment received a CDN 403 while trying to inspect image pixels. The app preserves the authoritative URLs; validate image delivery on Hostinger before launch. Do not replace a real garment photo with an AI-invented design.

## Deployment and scaling

The default deployment is one Node instance on Hostinger. Multi-instance setups need a shared Next.js cache backend. Order/queue state and usage limits already use shared PostgreSQL. Hostinger’s plan and access were not verified because its API/dashboard blocked this environment. No alternate hosting provider was substituted.

`Dockerfile` builds a non-root standalone runtime. The source ZIP excludes secrets, dependency folders and compiled output. The Hostinger API token is not part of the storefront. Add customer-facing shipping, returns and privacy policies based on the actual operating terms before accepting payment.
