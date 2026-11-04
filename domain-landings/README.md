# Hustler Dior domain landing pages

Two dependency-free static landing pages featuring verified product names, images and links captured from https://hustlerdior.com/ on November 4, 2026.

- `shop/`: cream, ink and acid-lime product discovery page, 12 featured pieces.
- `cloud/`: dark editorial lookbook with lavender accents, 9 selected pieces.
- Purchases, prices, variants, shipping and policies remain on the main store.
- Product links include domain-specific UTM attribution. No third-party analytics or lead-capture data collection is added.
- Catalog is a dated snapshot, not an automatic inventory sync. Product price and stock claims are deliberately omitted; current details are on the linked product pages.
- Real images use the main store's existing image optimization endpoint. Product images therefore depend on the main store remaining available.

## Preview

Run `python -m http.server 8765 --directory domain-landings`, then open `/shop/` or `/cloud/` at localhost:8765.

## Deploy

Upload the contents of the appropriate directory to the domain's public root. No build step or secrets are required. Keep each domain's canonical URL, robots.txt and sitemap.xml together.

The existing .shop website uses Hostinger Horizons; apply the design there without deleting its other routes. The new .cloud website uses static Hostinger hosting. No production .com application files are changed by this directory.

## Features

Responsive product grids, working text search with no-results state, native FAQ disclosures, keyboard focus styles, skip navigation, reduced-motion support, product image alt text, domain-specific metadata, and CollectionPage/ItemList structured data.
