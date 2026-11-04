# Chrome storefront design QA

Source visual truth: user upload `f4b1e20b-0c6a-4558-a57a-56af2c7c6117(1).png` (1086×1448), the dense Graphic Tees reference.
Implementation: `docs/design/evidence/desktop.jpg`, `docs/design/evidence/mobile-grid.jpg`; browser at http://terminal.local:4173/.

Compared source and rendered images together. Reference is an art-directed 1086px illustration; implementation uses unmodified current Printful mockups and real retail prices. Merchandise artwork scale, catalog names and assortment therefore intentionally differ. No generated merchandise or promotions were introduced.

Viewports: same-origin preview frames of 390, 768, 1024, 1440 CSS px; browser scrollbar occupies 15px. Document client/scroll widths equal 375/375, 753/753, 1009/1009, 1425/1425 respectively. Grid tracks: 2,3,4,4. Screenshots are browser viewport captures with surrounding grey harness; 1440px frame is wider than the capture, so complete desktop visual review uses the 1024px frame and 1334px direct page. Browser capture density 1×. Mobile screenshot captures a focused product-grid region; the mobile masthead and compact menu were separately visually inspected.

Fidelity surfaces:
- Typography: Anton condensed headings/product names, Barlow Condensed navigation, DM Sans body; actual crowned HD artwork rendered in chrome. Licensed open-source font packages. Long real names wrap/clamp to three lines; complete names remain accessible and on detail pages.
- Spacing: 235px desktop masthead, tight 7px desktop/6px mobile gutters, twelve initial products. Visible price text and 44px controls intentionally exceed the reference's tiny controls.
- Colors: black/distressed charcoal, warm concrete, crimson controls, chrome masthead. White controls on dark red; dark product text on concrete.
- Imagery: real Printful assets preserved. Optimized generated decorative textures/brand asset only. No recreated garment graphics.
- Copy: real catalog names/prices; policy URLs and existing checkout availability copy preserved. No invented shipping or refund claims.

Comparison history: initial header crest included adjacent lettering; corrected its CSS crop. Development preview displayed nonresponsive controls; repeated QA against the successful production build instead. Local upstream image optimization was slow; used byte-identical downloaded Printful images and a current public-catalog snapshot solely in the local QA harness. These fixtures and harness are excluded from the release.

Interactions: quick-add opened genuine Black/Heather Grey/Stone/White and S–2XL selector; add disabled until explicit size. Black/M added at $31.91, bag counter 1, cart retained after reload. Local detail endpoint served actual catalog fixture for this frontend test; this is not a live payment or provider availability certification. Search Larry Hoover returned one item; M filter retained it; descending prices verified $50, $43.50, $42, $39.99…; clearing restored collection. Existing server tests verify commerce boundaries. Native dropdowns keyboard accessible; dialogs use existing Radix focus management. Reduced-motion CSS disables new transitions.

Console: no application errors observed in production preview; browser extension metadata errors excluded. Lint/typecheck pass; 84 unit + 10 server tests pass; production Webpack/standalone build passes.

Residual P3: reference's oversized artwork cannot be matched by changing actual supplier product graphics. Smoke overlay not included; lightweight hover movement retained. Live provider image loading and deployed release remain deployment verification tasks.

final result: passed
