# Chrome storefront rollout and rollback

Baseline: main 7c5ede1ef5a2df3e1e759849d4169a244de8d6e9. Hostinger healthy baseline deployment: 01a1a84a-716e-70c3-a0b3-a0ae389f4953.

1. Implement on design/chrome-streetwear-20261104: approved-emblem chrome masthead, distressed textures, accessible navigation, dense real-product grid, native filters, validated quick-add and existing cart.
2. Validate lint, TypeScript, 84 unit and 10 server tests, Webpack standalone production build. Compare actual browser renders at 390, 768, 1024 and 1440px; exercise filters, search, dialog, cart persistence and navigation. Preview fixtures are actual catalog data; they cannot establish payment readiness.
3. Open PR; merge only after visual and functional QA passes. Preserve Hostinger configuration and secrets. Build command stays `next build --webpack && node scripts/prepare-standalone.mjs`. Observe the exact new deployment SHA/ID and health; verify merchandise images, cart and checkout availability notice on live domain.
4. Activate payments separately only after database, worker authentication, webhook/reconciliation, policies and payment/fulfillment tests pass. This visual release must not change readiness flags or commerce configuration.

Rollback triggers: broken imagery, blank catalog, unresponsive variant/cart controls, horizontal overflow obscuring controls, elevated server errors or failed health. Restore the recorded healthy Hostinger build through its supported rollback control. If unavailable, revert this frontend merge on main and deploy that revert with the unchanged build command. Do not reset or force-push main; do not change environment variables, Stripe mappings or orders. Verify health, catalog, product URLs, bag persistence, checkout notice and canonical/www redirects after rollback. No database migration is included, so no data rollback is needed.

Assets: chrome masthead generated from the owner's authorized crowned HD lockup and screenshot; concrete and distressed textures generated specifically for the website. Product imagery is unmodified Printful catalog imagery; no generated merchandise. Anton, Barlow Condensed and DM Sans are open-source Fontsource packages. Phosphor supplies interface icons.
