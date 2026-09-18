# Wholesale inventory for Hustler Dior

Updated September 13, 2026.

**10 styles have been added to the project's draft inventory, with original descriptions, researched options and 43 supplier photo references. Zero products were published or ordered.** These are style candidates, not stocked units or verified sellable variants.

Actual image files could not be obtained: the attempted official S&S CDN download returned HTTP 403. The package retains supplier image identifiers and candidate CDN URLs, with download and permission statuses. The image library redirects to an account login. [S&S image library](https://www.ssactivewear.com/marketing/imagelibrary)

## Supplier shortlist

| Supplier                                                      | Fit for Hustler Dior                                                                                                                                                      | Integration and current finding                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [S&S Activewear](https://www.ssactivewear.com/)               | First capsule: Shaka Wear, Lane Seven, Independent Trading Co. and YP Classics. These are supplier-brand essentials; the photos do not show custom Hustler Dior printing. | Public pages establish styles and specifications. Wholesale costs and stock require an approved account. Its API uses an account number and API key. [API](https://api.ssactivewear.com/V2/Default.aspx), [product fields](https://api.ssactivewear.com/V2/Products.aspx)       |
| [BrandsGateway](https://brandsgateway.com/dropshipping/)      | A separate premium men's/women's branded fashion capsule.                                                                                                                 | Custom stores can use REST API; CSV is also available. The supplier explicitly permits supplied images and descriptions to list corresponding products through an approved integration, API or CSV. Feed/subscription access, landed costs and fulfillment remain unconfigured. |
| [Faire streetwear](https://www.faire.com/discover/streetwear) | Independent labels and more varied women's/men's collections.                                                                                                             | Retailer account and brand-specific terms. Obtain a permitted export and verify minimum orders and customer fulfillment. A marketplace listing is not a live dropshipping stock feed.                                                                                           |
| [AS Colour](https://ascolour.com/wholesale-faqs)              | Decorated original-brand basics for a future Hustler Dior line.                                                                                                           | Its wholesale policy requires resale of decorated garments; wholesale pricing does not permit blank resale. It publishes product assets and CSV/API resources. No blank AS Colour stock was added. [Assets](https://ascolour.com/assets)                                        |

These are sourcing candidates, not endorsements of every garment or an assertion that Hustler Dior has approved accounts. BrandsGateway states its merchandise is authentic; retain actual invoices and documentation for selected lots. No approved Nike/Jordan distributor or live sneaker feed has been established. The official starting point remains the [Nike retailer application](https://www.nike.com/help/a/new-account).

## Draft capsule added

| Supplier style | Product                                  | Audience | Researched sizes | Source                                                                    |
| -------------- | ---------------------------------------- | -------- | ---------------- | ------------------------------------------------------------------------- |
| SHGD           | Shaka Wear garment-dyed heavyweight tee  | Unisex   | XS–5XL           | [Product](https://www.ssactivewear.com/p/shaka_wear/shgd)                 |
| SHMCS          | Shaka Wear heavyweight cropped tee       | Unisex   | S–2XL            | [Product](https://www.ssactivewear.com/p/shaka_wear/shmcs)                |
| SHVBJ          | Shaka Wear varsity bomber                | Unisex   | S–3XL            | [Product](https://www.ssactivewear.com/p/shaka_wear/shvbj)                |
| SHFJP          | Shaka Wear fleece joggers                | Unisex   | S–5XL            | [Product](https://www.ssactivewear.com/p/shaka_wear/shfjp)                |
| LS14001        | Lane Seven premium hoodie                | Unisex   | XS–5XL           | [Product](https://www.ssactivewear.com/p/lane_seven/ls14001)              |
| LS14004        | Lane Seven premium crewneck              | Unisex   | XS–3XL           | [Product](https://www.ssactivewear.com/p/lane_seven/ls14004)              |
| PRM2000        | Independent women's Wave Wash crewneck   | Women    | XS–2XL           | [Product](https://www.ssactivewear.com/p/independent_trading_co/prm2000)  |
| PRM2500        | Independent women's Wave Wash hoodie     | Women    | XS–2XL           | [Product](https://www.ssactivewear.com/p/independent_trading_co/prm2500)  |
| PRM20PNT       | Independent women's Wave Wash sweatpants | Women    | XS–2XL           | [Product](https://www.ssactivewear.com/p/independent_trading_co/prm20pnt) |
| 6089M          | YP Classics flat-bill snapback           | Unisex   | Adjustable       | [Product](https://www.ssactivewear.com/p/yp_classics/6089m)               |

Descriptions are newly written from the cited specifications. Black is the photo-reference color. Other researched colors are options to investigate, not confirmed combinations or quantities. Page legends about discontinued or case-only items were not treated as selected-variant stock. Public starting prices were not mistaken for account-specific wholesale costs.

## Files and commands

The source now contains:

- `inventory/wholesale-candidates.json`: 10 styles, original descriptions, sources and 43 image references.
- `src/lib/supplier-candidates.ts`: a research schema requiring unknown costs and stock to remain null, and sale enablement to remain false.
- `scripts/stage-wholesale-candidates.mjs`: creates validated working drafts under `private-data/wholesale-candidates.json`.
- `scripts/fetch-ss-activewear.mjs`: a read-only quote connector for these selected style IDs. It cannot order products or publish inventory.
- A review package with JSON, product CSV, image-reference CSV and an HTML index. It contains no downloaded image binaries or active buy buttons.

From the project root:

```bash
node --import tsx scripts/stage-wholesale-candidates.mjs
```

Configure server-only credentials from an approved supplier account:

```dotenv
SS_ACTIVEWEAR_ACCOUNT_NUMBER=
SS_ACTIVEWEAR_API_KEY=
```

Then fetch account-specific product quotes:

```bash
node --import tsx --env-file=.env.local scripts/fetch-ss-activewear.mjs
```

The connector writes `private-data/ss-activewear-quoted-products.json`. Supplier credentials were unavailable, so a real account request has not been executed or verified. BrandsGateway's approved CSV/API export needs its own mapping.

An actual feed must establish variant SKU, size/color, current stock, customer cost, channel restrictions, minimum quantities and returnability. Images must be supplied or permitted for this selling channel. Preserve S&S's `noeRetailing`, MAP and warehouse restrictions in quote review.

Calculate delivery, duties and returns, approve retail prices, configure supplier fulfillment, and then publish. Reserve/recheck wholesale stock and route those orders separately from Printful. The existing `stage-wholesale.mjs` remains the stricter importer for a complete authorized variant feed; this research JSON intentionally cannot pass as one.

## Margin target

Use 35–40% contribution after product cost, supplier shipping, duties, payment fees and a returns allowance as an initial planning range. Include AI and acquisition costs when measuring profitability. Actual wholesale margins cannot be asserted until account-specific costs are available.

`customer charge = (product + shipping + duties + packaging + returns allowance + fixed payment fee) / (1 - target contribution - percentage payment fee)`

Treat sales tax collected for remittance separately from revenue. Check supplier MAP rules and include subscription overhead. No retail price, discount, stock count, authenticity badge or delivery promise was invented for these drafts.

## Missing input for activation

Provide an approved supplier product export or securely configure the S&S account/API connection, including access to permitted product images. Hostinger publication and production payment/fulfillment configuration also remain to be completed; these local draft additions are not a live deployment.


## September 14 dropshipping expansion

The additional 22 CJ/Trendsi buying drafts and 17 product photos are documented in [DROPSHIP-EXPANSION.md](DROPSHIP-EXPANSION.md). Run `npm run inventory:dropship` to validate and stage them privately. Existing S&S candidates remain unchanged. Zendrop, designer and research-service leads are separate from the inventory count. All new records remain unsellable until supplier stock, costs, rights and fulfillment are connected.
