# Sitemap robots check

`npm run seo:robots` reads a site's `sitemap.xml` and fails when any listed URL is `noindex`, returns more than one `robots` meta, or is not HTTP 200. `/checkout` and `/curated` are intentionally `noindex` and must stay out of the sitemap. The check fetches those two paths and requires exactly one robots meta: `noindex, nofollow` on checkout and `noindex, follow` on curated.

Sitemap locations are requested on the base URL you pass, so a local server can be checked even though canonical locations use `https://hustlerdior.com`.

## Production

```bash
npm run seo:robots -- https://hustlerdior.com
```

No local build is required. The command only sends GET requests.

## Local production server

```bash
npm run build
SITE_URL=https://hustlerdior.com SITE_ROLE=primary CATALOG_SNAPSHOT_PREVIEW=true npm start
npm run seo:robots -- http://127.0.0.1:3000
```

`SITE_URL=https://hustlerdior.com` makes the local host indexable, so `sitemap.xml` is populated. `CATALOG_SNAPSHOT_PREVIEW=true` serves the saved catalog when no Printful token is set. Leave payment and supplier secrets unset.

GitHub Actions runs the same local check on pull requests (`.github/workflows/seo-robots.yml`).
