# Streetwear CSV attachment

Project: hustlerdior.com

Source: `inventory/hustler-dior-streetwear-150.csv`

The uploaded CSV is retained byte for byte, including all product descriptions, tags, SEO fields, prices, costs, quantities and supplier research notes.

| Check | Result |
|---|---:|
| Data rows | 188 |
| Unique product handles | 188 |
| Unique variant SKUs | 188 |
| Columns | 38 |
| Rows marked draft | 188 |
| Rows marked Published=FALSE | 188 |
| Rows with image URLs | 0 |
| Rows with HTTP/HTTPS source URLs | 0 |
| Malformed rows | 0 |

The filename includes 150, but the supplied file contains 188 unique product records. All records are preserved.

The file is attached under `inventory/`, outside the public assets directory. No runtime catalog or supplier-import script reads it automatically. The existing Printful and Shopify catalogs remain independent of this attachment.

Before importing for sale, verify the supplier SKU and source, product photographs and usage permission, actual inventory, fulfillment, costs and retail pricing. `SourceUrl` currently contains research descriptors, and `Image Src` is empty. The supplied quantities, costs, suggested margins and compare-at prices are retained as provided; they have not been validated as current supplier offers.

CSV SHA-256: `e847ede818b53d80bfbadf8a0e3b837d97560968395b2a1233d460d7c5f6a61a`
