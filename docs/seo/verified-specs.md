# Verified product specs (Printful data only)

Generated 2026-10-02 (ET) from the live Printful API: `GET /store/products` (+ `/store/products/{id}`) for store 18747907, and `GET /products/{blank_id}` for each underlying blank's catalog data. Raw per-product text (verbatim) is in `verified-specs.csv`. A blank cell means **not stated by Printful = unverified**; nothing here is filled from memory.

Store model: print-on-demand through Printful. Do not claim in-house manufacturing, in-house DTF, or own sewing. Say "printed/embroidered on demand by our fulfillment partner Printful" if production needs mention. The blank text itself says e.g. "Blank product sourced from ...".

## Counts
- Store products (sync products): **159**; each maps to exactly one blank, so 159 CSV rows.
- Distinct blanks (catalog products): **61**; 60 fetched OK, 1 returned 404 (id 626, Columbia Women's Fleece Vest -> 1 store product, left UNVERIFIED).
- Rows with a stated weight (oz/yd² and/or g/m²) in Printful text: **149** (all other 10 rows blank).
- Rows with a fit statement in Printful text: **117**.

## Summary by blank (weights verbatim from Printful)
| Blank (brand / model / catalog id) | Store products | Printful-stated fabric weight (verbatim) |
|---|---|---|
| Stanley/Stella / SATU020 / Unisex Organic Oversized High Neck Blaster 2.0 T-Shirt / Stanley/Stella SATU020 (catalog id 823) | 27 | 5.9 oz./yd.² (200 g/m²) |
| Comfort Colors / 1717 / Unisex Garment-Dyed Heavyweight T-Shirt / Comfort Colors 1717 (catalog id 586) | 2 | 6.1 oz/yd² (206.8 g/m²) |
| Bella + Canvas / 4810GD / Unisex Heavyweight Garment Dye Tee / Bella + Canvas 4810GD (catalog id 880) | 1 | 6.5 oz./yd.² (220.4 g/m²) |
| UNVERIFIED: blank product_id 626 (Columbia Women's Fleece Vest) - catalog endpoint returned 404 | 1 | — (unverified) |
| (no brand listed) / All-Over Print Unisex Cotton Hoodie / All-Over Print Unisex Cotton Hoodie (catalog id 1419) | 2 | 7.8 oz./yd.² (265 g/m²) |
| (no brand listed) / All-Over Print Unisex Cotton Sweatshirt / All-Over Print Unisex Cotton Sweatshirt (catalog id 1418) | 1 | 7.8 oz./yd.² (265 g/m²) |
| Shaka Wear / SHHTDS / Unisex Oversized Tie-Dye T-Shirt / Shaka Wear SHHTDS (catalog id 515) | 1 | 7.5 oz/yd² (254 g/m²) |
| AS Colour / 4062 / Women's Crop Top / AS Colour 4062 (catalog id 636) | 1 | 5.3 oz/yd² (180 g/m²) |
| AS Colour / 5082 / Men's Oversized Faded T-Shirt / AS Colour 5082 (catalog id 713) | 27 | 7.1 oz. /yd. ² (240 g/m²) |
| (no brand listed) / All-Over Print Men’s Cotton Crew Neck T-Shirt / All-Over Print Men’s Cotton Crew Neck T-Shirt (catalog id 1414) | 2 | Midweight fabric: 5.6 oz./yd.² (189 g/m²) |
| Comfort Colors / 1567 / Unisex Garment-Dyed Hooded Sweatshirt I Comfort Colors 1567 (catalog id 970) | 1 | 9.5 oz./yd.² (322 g/m²) |
| Independent Trading Co. / EXP54LWZ / Unisex Lightweight Zip Up Windbreaker / Independent Trading Co. EXP54LWZ (catalog id 629) | 1 | 2.5 oz/yd² (84.8 g/m²) |
| Independent Trading Co. / IND20SRT / Men's Fleece Shorts / Independent Trading Co. IND20SRT (catalog id 482) | 1 | 8.5 oz/yd² (280 g/m²) |
| Lane Seven / LS16006 / Unisex Urban Sweatpants / Lane Seven LS16006 (catalog id 1398) | 1 | Heavyweight fabric: 10 oz./yd² (340 g/m²) |
| (no brand listed) / All-Over Print American Football Jersey / All-Over Print American Football Jersey (catalog id 918) | 1 | 7.23 oz./yd. (245 g/m²) |
| (no brand listed) / Shoes / Men's / Lace-Up / Canvas / Men's Lace-Up Canvas Shoes (catalog id 578) | 1 | — (not stated) |
| (no brand listed) / All-Over Print Bandana / All-Over Print Bandana (catalog id 630) | 1 | Fabric weight in the EU: 2.95 oz./yd.² (100 g/m²) | • Fabric weight in the US: 3.24 oz./yd.² (110 g/m²) |
| (no brand listed) / All-Over Print Unisex Track Pants / All-Over Print Unisex Track Pants (catalog id 618) | 1 | 2.21 oz/yd² (75 g/m²) |
| Comfort Colors / 1467 / Unisex Garment-Dyed Lightweight Fleece Hooded Sweatshirt I Comfort Colors 1467 (catalog id 969) | 1 | Lightweight fabric: 6.4 oz./yd.² (217 g/m²) |
| AS Colour / 5081 / Unisex Premium Heavyweight Long Sleeve Shirt / AS Colour 5081 (catalog id 748) | 1 | 8.2 oz./yd.² (278 g/m²) |
| Cotton Heritage / MC1087 / Men's Box Tee / Cotton Heritage MC1087 (catalog id 917) | 4 | 7 oz./yd.² (237.34 g/m²) |
| SOL'S / 11939 / Unisex Sports Jersey / SOL'S 11939 (catalog id 715) | 1 | 4.13 oz./yd² (140 g/m²) |
| AS Colour / 5001T / Unisex Premium T-Shirt / AS Colour 5001T (catalog id 733) | 1 | 5.3 oz./yd.² (180.25 g/m²) |
| Yupoong / 6245CM / Classic Dad Hat / Yupoong 6245CM (catalog id 206) | 2 | — (not stated) |
| Bella + Canvas / 4711 / Unisex Oversized Heavyweight Sweatshirt / Bella + Canvas 4711 (catalog id 897) | 2 | 10 oz./yd.² (339 g/m²) |
| Cotton Heritage / M2635 / Men's Box Hoodie I Cotton Heritage M2635 (catalog id 953) | 1 | 10 oz./yd.² (339 g/m²) |
| Bella + Canvas / 8803 / Women's Muscle Tank / Bella + Canvas 8803 (catalog id 271) | 1 | 4.2 oz/y² (142 g/m²) |
| Tultex / 245 / Unisex 3/4 Sleeve Raglan Shirt / Tultex 245 (catalog id 233) | 1 | 4.5 oz/yd² (152.6 g/m²) |
| Champion / S700 / Unisex Champion Powerblend Hoodie / S700 (catalog id 842) | 2 | 9 oz./yd.² (305 g/m²) |
| Gildan / 64000L / Women's Basic Softstyle T-Shirt / Gildan 64000L (catalog id 849) | 1 | 4.5 oz./yd.² (153 g/m²) |
| Under Armour / 1383264 / Men's Under Armour Athletic T-Shirt / 1383264 (catalog id 773) | 1 | 7.41 oz./yd.² (251.24 g/m²) |
| Bella + Canvas / 3480 / Unisex Staple Tank Top / Bella + Canvas 3480 (catalog id 248) | 1 | 4.2 oz/yd² (142.40 g/m²), triblends: 3.8 oz/yd² (90.07 g/m²) |
| Gildan / 64000 / Unisex Basic Softstyle T-Shirt / Gildan 64000 (catalog id 12) | 3 | 4.5 oz/yd² (153 g/m²) |
| (no brand listed) / All-Over Print Men's Crew Neck T-Shirt / All-Over Print Men's Crew Neck T-Shirt (catalog id 257) | 1 | - Fabric weight in the EU: 6.34 oz./yd.² (215 g/m²) | - Fabric weight in the US: 7.08 oz./yd.² (240 g/m²) |
| Bella + Canvas / 3001 / Unisex Staple T-Shirt / Bella + Canvas 3001 (catalog id 71) | 4 | 4.2 oz./yd.² (142 g/m²) |
| Bella + Canvas / 7502 / Women's Cropped Hoodie / Bella + Canvas 7502 (catalog id 317) | 3 | 6.5 oz/yd² (220.39 g/m²) |
| Gildan / 18500 / Unisex Heavy Blend Hoodie / Gildan 18500 (catalog id 146) | 4 | 8.0 oz/yd² (271.25 g/m²) |
| Gildan / 5000 / Unisex Classic Tee / Gildan 5000 (catalog id 438) | 14 | 5.0–5.3 oz/yd² (170-180 g/m²) |
| Cotton Heritage / M2580 / Unisex Premium Pullover Hoodie / Cotton Heritage M2580 (catalog id 380) | 2 | — (not stated) |
| Cotton Heritage / M2480 / Unisex Premium Sweatshirt / Cotton Heritage M2480 (catalog id 411) | 1 | 8.5 oz/y² (288.2 g/m²) |
| Bella + Canvas / 3001T / Toddler Staple Tee / Bella + Canvas 3001T (catalog id 306) | 1 | 4.2 oz/yd² (142 g/m²) |
| Bella + Canvas / 3501 / Unisex Long Sleeve Tee / Bella + Canvas 3501 (catalog id 356) | 2 | 4.2 oz./yd.² (142.4 g/m²) |
| Cotton Heritage / MC1790 / Men's Premium Tank Top / Cotton Heritage MC1790 (catalog id 537) | 2 | 5.5 oz/yd² (186.48 g/m²) |
| Bella + Canvas / 3512 / Unisex Hooded Long Sleeve Tee / Bella Canvas 3512 (catalog id 688) | 1 | 3.8 oz/yd² (128.84 g/m²) |
| Otto Cap / 18-1248 / Vintage Cap / Otto Cap 18-1248 (catalog id 327) | 3 | — (not stated) |
| Next Level / 3601 / Men's Fitted Long Sleeve Shirt / Next Level 3601 (catalog id 116) | 1 | 4.3 oz/yd² (149.2 g/m²) |
| Cotton Heritage / MC1086 / Men's Premium Heavyweight Tee / Cotton Heritage MC1086 (catalog id 508) | 2 | 6.5 oz/yd² (220 g/m²) |
| (no brand listed) / All-Over Print Unisex Athletic Long Shorts / All-Over Print Unisex Athletic Long Shorts (catalog id 332) | 1 | 5.13 oz. /yd. ² (174 g/m²) |
| Comfort Colors / 6030 / Unisex Garment-Dyed Pocket T-Shirt / Comfort Colors 6030 (catalog id 593) | 1 | 6.1 oz/yd² (206.8 g/m²) |
| Comfort Colors / 1566 / Unisex Garment-Dyed Sweatshirt / Comfort Colors 1566 (catalog id 839) | 2 | 9.5 oz./yd.² (322 g/m²) |
| Bella + Canvas / 6882GD / Women's Garment Dye Cropped Tee / Bella + Canvas 6882GD (catalog id 1579) | 1 | 6.5 oz./yd.² (220 g/m²) |
| (no brand listed) / All-Over Print Boxy Football Jersey / All-Over Print Boxy Football Jersey (catalog id 1367) | 1 | — (not stated) |
| (no brand listed) / All-Over Print Oversized Cotton T-Shirt / All-Over Print Oversized Cotton T-Shirt (catalog id 1482) | 2 | 8.85 oz./yd.² (300 g/m²) |
| (no brand listed) / All-Over Print Unisex Cotton Long Shorts / All-Over Print Unisex Cotton Long Shorts (catalog id 1480) | 1 | 8.85 oz./yd.² (300 g/m²) |
| (no brand listed) / All-Over Print Utility Crossbody Bag / All-Over Print Utility Crossbody Bag (catalog id 744) | 1 | 9 oz./yd.² (305 g/m²) |
| Shaka Wear / SHGDD / Unisex Garment-Dyed Drop-Shoulder T-Shirt / Shaka Wear SHGDD (catalog id 1626) | 2 | 7.5 oz./yd.² (254 g/m²) |
| Comfort Colors / 6014 / Unisex Garment-Dyed Heavyweight Long Sleeve Shirt / Comfort Colors 6014 (catalog id 753) | 1 | 6.1 oz./yd.² (206.8 g/m²) |
| Bella + Canvas / 3010 / Unisex Oversized Boxy Tee / Bella+Canvas 3010 (catalog id 1592) | 6 | 6 oz./yd.² (170 g/m²) |
| Stanley/Stella / SASU042 / STSU282 / Unisex Garment-Dyed Chaser Vintage Hoodie / Stanley/Stella SASU042/STSU282 (catalog id 1659) | 1 | 9.7 oz./yd.² (330 g/m²) |
| Stanley/Stella / SASU057 / STSU278 / Unisex Sculpted Heavyweight Hoodie / Stanley/Stella SASU057 / STSU278 (catalog id 1658) | 1 | 15 oz./yd.² (500 g/m²) |
| (no brand listed) / All-Over Print Unisex Button Shirt / All-Over Print Unisex Button Shirt (catalog id 659) | 1 | Fabric weight in the EU: 2.95 oz./yd.² (100 g/m²) | • Fabric weight in the US: 3.24 oz./yd.² (110 g/m²) |

## Keywords we CAN back (Printful states it)
- **Heavyweight / fabric-weight claims**, only with the exact stated number for the specific blank:
  - Stanley/Stella SASU057/STSU278 Sculpted Heavyweight Hoodie (catalog 1658): "Fabric weight: 15 oz./yd.² (500 g/m²)" -> the **only** store product where a **500 gsm hoodie** claim is backed (store product "Hustler Dior Dog Gone Unisex sculpted heavyweight hoodie" (store id 475170849; the only row on blank 1658)).
  - Lane Seven LS16006 Urban Sweatpants: 10 oz./yd² (340 g/m²), "heavyweight fleece".
  - Bella + Canvas 4711 Oversized Heavyweight Sweatshirt: 10 oz./yd.² (339 g/m²).
  - Cotton Heritage M2635 Men's Box Hoodie: 10 oz./yd.² (339 g/m²).
  - Comfort Colors 1566 sweatshirt / 1567 hoodie: 9.5 oz./yd.² (322 g/m²).
  - Champion S700 Powerblend Hoodie: 9 oz./yd.² (305 g/m²).
  - Stanley/Stella SASU042/STSU282 Chaser Vintage Hoodie: 9.7 oz./yd.² (330 g/m²), garment-dyed, "heavyweight".
  - Gildan 18500 Heavy Blend Hoodie: 8.0 oz/yd² (271.25 g/m²).
  - Heavyweight tees: Bella + Canvas 3010 (6 oz, 170 g/m²), 4810GD (6.5 oz, 220.4), Comfort Colors 1717 (6.1 oz, 206.8), Shaka Wear SHGDD (7.5 oz, 254), Cotton Heritage MC1086 (6.5 oz, 220), MC1087 box tee (7 oz, 237.34), AS Colour 5082 oversized faded (7.1 oz, 240), All-Over Print Oversized Cotton T-Shirt (8.85 oz, 300 g/m², "Heavyweight cotton-spandex blend").
- **Oversized / boxy / relaxed fit** where the blank text says so (see `fit_if_stated` column for each).
- **Garment-dyed** (Comfort Colors, Bella+Canvas GD, Stanley/Stella Chaser, Shaka Wear): stated in the blank descriptions.
- **Embroidery** and **DTF** as available techniques: only to the extent the sync file placements use them (`embroidery_*`, `*_dtf`) and the blank lists them. Phrase as "embroidered" / "DTF-printed" by Printful, not "in-house".
- **Material percentages** (e.g. "100% combed and ring-spun cotton", "100% organic ... cotton") only as quoted in the CSV text for that blank.

## Keywords we CANNOT back
- **500+ gsm hoodie** on any product other than blank 1658 (all other hoodies stated at 271-339 g/m²).
- **600 gsm / 600+ gsm anything**: no Printful blank in this store states >500 g/m².
- **Loopback / French terry**: the word "loopback" does not appear in any blank text (and no "French terry"). Don't claim it.
- **Raw denim / denim garments**: no denim product exists in the store (the only "denim" hit is a colour mention in Tultex 245 text).
- **"In-house DTF" / "in-house printing" / "we manufacture" / "made in the USA by us"**: store is Printful print-on-demand; any such claim is false.
- **Weights for products with no stated weight (blank cells)**: Cotton Heritage M2580 Premium Pullover Hoodie (2 store products), Yupoong 6245CM Dad Hat (2), Otto Cap 18-1248 Vintage Cap (3), Men's Lace-Up Canvas Shoes (1), All-Over Print Boxy Football Jersey (1), and Columbia Fleece Vest (catalog 404, 1). Don't give gsm/oz for these.
- **Anything about the Gildan 5000 beyond its range**: Printful states "5.0–5.3 oz/yd² (170-180 g/m²)"; don't round to a single number.
- Printful gives different US/EU weights for some All-Over Print blanks (e.g. Crew Neck T-Shirt 7.08 oz US vs 6.34 oz EU); quote the US value with label.
- **Store titles that say "heavyweight"** on blanks whose text states a weight are fine; verify each against the CSV before quoting a number, because the same title style is used across many blanks.

## Caveats
- `print_method_if_stated`: Printful's sync data doesn't name a technique per product. The column lists the placement file types the store actually uses (`default`, `back`, `front_dtf`, `embroidery_chest_left` ...) and the techniques the blank offers. A technique label (Embroidery / DTF printing / DTFabric) is shown only when a placement type name says so; otherwise "not stated per product".
- `fit_if_stated` = every line of Printful's text containing fit/oversized/relaxed/boxy/loose/silhouette words, verbatim.
- Data can change on Printful's side; re-run the pull before publishing numbers.
