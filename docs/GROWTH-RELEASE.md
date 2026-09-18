# Inventory discovery and revenue readiness — September 15, 2026

The uploaded Shopify source archive matches the preceding live release. Revalidating and normalizing its complete export retains 46 products and 399 variants. A fresh connected Shopify audit also finds 46 products, 399 variants, zero available variants, zero quantities, and no supplier unit costs. No product is made orderable solely because its Shopify status is ACTIVE.

## Customer-facing improvements

- Extended Edit has fit filters derived from explicit product titles/types/tags. Unknown fits remain “Not specified”; they are not relabeled unisex. This Shopify import has no explicitly classified kids products.
- Budget filters compare the displayed starting variant price. Sorting supports price and name. All catalog prices are USD; preview prices do not establish future checkout availability.
- Save buttons and a Saved Pieces filter retain product IDs in versioned local storage. Saving does not reserve stock or subscribe anyone to marketing. Reloading preserves the selection when browser storage is available.
- Complementary Printful products respect the bag’s fit context. Kids-only bags receive only kids items. Adult-specific bags can receive the corresponding fit and unisex pieces. Mixed family bags can receive both.
- Recommendations exclude current products, invalid prices, unavailable variants and other currencies. Stale recommendations are hidden immediately when the bag changes. Multiple variants still require an explicit size/color selection.

## Inventory and promotion constraints

The Shopify export has no verified supplier costs, so Shopify margins remain unverified. The fresh Printful estimate audit and repricing worksheets are private merchant reports, excluded from website assets and source backups. Suggested prices are proposals and have not changed provider retail prices.

Do not switch checkout on or scale paid acquisition before current pricing clears destination-specific fulfillment costs and the margin guard. The guard models contribution before advertising, overhead and other operating expenses; it does not guarantee net profit. Check shipping, tax, returns and actual payment-fee treatment before approving prices.

## Integration choices

This release is Next.js, not WordPress. FunnelKit, CartFlows and WordPress SEO plugins cannot be activated inside this application. Native cart add-ons and structured metadata are already implemented. Omnisend and GSC Wizard were suggested as optional connected apps for marketing analytics and search analysis; suggesting them does not install runtime scripts or subscribe to a paid service. No marketing campaign was sent.

Stripe's connected account can accept charges, but live storefront payments remain disabled pending protected runtime setup, PostgreSQL, signed webhooks, tax settings, worker scheduling and end-to-end verification. AI generation remains disabled pending its separate provider credential and budget. Existing HTTPS, catalog synchronization, cart, motion and fitting-room UI are retained.

See PAYMENTS-TRYON.md for runtime requirements and the current launch-status document for deployment verification. The fresh private growth report includes supplier links, public quote limitations and the sampled price correction sheet.
