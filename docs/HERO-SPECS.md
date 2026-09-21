# Crown Meets Concrete hero

Figma specification: https://www.figma.com/design/zuqdLZPAAdfJMBZwU9l4pJ?node-id=2-2

Copy: **CROWN MEETS CONCRETE.**

Supporting line: Virginia Beach roots. Graphic streetwear. Built for your rotation.

Primary action: `SHOP THE LATEST`, linking to `/#shop`. Secondary action: `OUR WORLD`, linking to `/about`.

| View | Layout |
| --- | --- |
| Mobile, 390 px reference | 20 px gutters, 56 px header, copy before art, 56/60 headline, 16/24 body, 52 px primary action, 350 × 394 px product image |
| Desktop, 1440 px reference | 64 px gutters, 12 columns, 24 px gaps, copy spans 5 columns and art spans 7, headline `clamp(56px, 7vw, 108px)` |

Use Anton display and DM Sans interface text. Colors: obsidian `#111111`, chalk `#F2EEE6`, safety accent `#DFEC3C`. Product photographs must match the selected garment and preserve its silhouette. Garment weight is SKU-specific; do not advertise 400 GSM across an unverified catalog.

One 600 ms entrance may play after first paint, with reduced-motion support. Keep navigation and purchase controls immediately available. Do not autoplay audio or mobile video. Grain opacity stays below 4%.

Serve a responsive AVIF/WebP lead image with explicit dimensions; target at most 180 KB on mobile. Preload only that image. Test LCP ≤2.5 seconds, INP ≤200 ms and CLS ≤0.1 at the 75th percentile. These are acceptance targets, not measured results for the unlaunched deployment.
