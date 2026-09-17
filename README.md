# Hustler Dior — The Concrete Edit

Independent graphic streetwear storefront. **Wear your own rules.**

- Brand: Hustler Dior / The Concrete Edit  
- Creative direction: Swerve God  
- Fulfillment: Printful (made-to-order)  
- Printful store: **18749826** (Hostinger website builder catalog, ~286 products)  
- Hosting: Hostinger  
- Stack: Next.js App Router · TypeScript · React

## What's included

Lean but runnable scaffold:

- Homepage with Concrete Edit streetwear vibe (not generic SaaS)
- `/collection` catalog shell
- `/product/[id]` product detail shell
- `PrintfulClient` class with static methods + mock fallback when env is missing
- Header / ProductCard / Footer components

## Setup

```bash
npm install
cp .env.example .env.local
```

### Environment

| Variable | Description |
|----------|-------------|
| `PRINTFUL_API_KEY` | Printful API token (Dashboard → Settings → API). **Secret — never commit.** |
| `PRINTFUL_STORE_ID` | Printful store ID. Default / Hostinger builder store: `18749826` |

Leave `PRINTFUL_API_KEY` blank to run against the built-in mock Concrete Edit drops.

## Local run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
npm run lint
```

## Printful notes

- Store **18749826** is the Hustler Dior Hostinger website-builder store.
- `src/lib/printful/client.ts` exposes `PrintfulClient.fetchCatalog()` and `fetchProduct(id)`.
- Catalog lists `/store/products` with pagination (limit 100, up to 300 products), skips ignored items, and leaves list prices at 0 ("Price on request" until PDP).
- PDP calls `/store/products/{id}` and uses the minimum `retail_price` from `sync_variants`.
- If the API key is missing or the API errors, the client returns mock products so the UI stays usable.
- `next.config.ts` allows `images.cdn.printful.com` and `files.cdn.printful.com`.

## Deploy on Hostinger

1. Push this repo (or connect GitHub) to your Hostinger Node.js / static hosting plan.
2. Set Node.js version **20+**.
3. Build command: `npm run build`
4. Start / output: `npm start` (or Hostinger's Next.js preset if available).
5. In the Hostinger environment panel set:
   - `PRINTFUL_API_KEY` — your Printful API token (**secret**; do not paste into git or README)
   - `PRINTFUL_STORE_ID=18749826`
6. Point your domain DNS at Hostinger and enable HTTPS.

For static export-only plans, prefer a Node runtime host; this app uses server components for catalog fetch.

## License

Private brand scaffold for Hustler Dior / Swerve God.
