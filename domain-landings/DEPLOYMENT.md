# Deployment record — November 4, 2026

## hustlerdior.cloud

- Provisioned on the existing Hostinger plan, order 1010020623; no purchase.
- Uploaded index.html, styles.css, app.js, robots.txt and sitemap.xml to the public root.
- Verified HTTP 200 with the actual Cloud Edit title and product content on both apex and www.
- SSL is active with HTTPS redirect enabled.
- Disabled the CDN after its apex endpoint failed TLS; the direct origin now serves the page successfully. MX and SPF records were verified preserved.
- DNS rollback snapshot before the CDN change: 194158334.
- Mobile screenshot reviewed: actual product images, two-column grid, navigation, hero and FAQ display correctly.
- All 12 source product URLs returned HTTP 200. Local JavaScript syntax and HTML anchor, heading, alt-text and UTM checks passed.
- Local browser automation was unavailable because the browser binary download failed. Search interaction was not tested in a real browser.

## hustlerdior.shop

- Existing Hostinger Horizons website: 28c7f8d1-1af3-4649-811f-12eed51df728.
- Submitted the homepage design, real catalog and .com purchase links to Horizons. Existing other routes and integrations were explicitly preserved in the edit request.
- Hostinger accepted publication after generation finished. Verified the public homepage returns HTTP 200 with The Concrete Shop title, WEAR YOUR OWN STORY hero, and actual product images and links. A subsequent targeted correction fixes query placement before collection fragments.
- The `shop` directory is the static reference design. Horizons translates the brief into its own React application, so its generated code is not the same source as the static reference.

## Source control

- GitHub: Swervegod1/hustlerdior, branch codex/domain-landings-20261104, PR 17.
- No matching Hustler Dior project was found in the connected GitLab account. No unrelated GitLab repository was modified.
- The existing .com application was not deployed or changed by this work.
