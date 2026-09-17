# Hustler Dior — The Concrete Edit

Independent graphic streetwear storefront. **Wear your own rules.**

- Brand: Hustler Dior / The Concrete Edit  
- Creative direction: Swerve God  
- Fulfillment: Printful (made-to-order)  
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
| `PRINTFUL_API_KEY` | Printful API token (Dashboard → Settings → API) |
| `PRINTFUL_STORE_ID` | Printful store ID |

Leave them blank to run against the built-in mock Concrete Edit drops.

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

- `src/lib/printful/client.ts` exposes `PrintfulClient.fetchCatalog()` and `fetchProduct(id)`.
- If credentials are missing or the API errors, the client returns mock products so the UI stays usable.
- `next.config.ts` allows `images.cdn.printful.com` and `files.cdn.printful.com`.

## Deploy on Hostinger

1. Push this repo (or connect GitHub) to your Hostinger Node.js / static hosting plan.
2. Set Node.js version **20+**.
3. Build command: `npm run build`
4. Start / output: `npm start` (or Hostinger's Next.js preset if available).
5. Add `PRINTFUL_API_KEY` and `PRINTFUL_STORE_ID` in the Hostinger environment panel — never commit real secrets.
6. Point your domain DNS at Hostinger and enable HTTPS.

For static export-only plans, prefer a Node runtime host; this app uses server components for catalog fetch.

## License

Private brand scaffold for Hustler Dior / Swerve God.
