# Marketing activation handoff

The connected Omnisend brand is not yet connected to this custom Next.js store. The connector's brand-connection endpoint does not accept a generic `api` platform. Use Omnisend's supported custom API integration and its runtime credential; do not identify this application as WordPress or WooCommerce.

## Prepared VIP form

The Omnisend draft **Hustler Dior — Crown Meets Concrete VIP** uses an embedded form, email signup, optional phone number, separate SMS consent, and the `hd_vip_early_access` tag. Its content and rendered steps were checked through the API. It has not been enabled or embedded in production. Review the privacy/SMS terms and sender setup before publication.

## Abandoned checkout workflow specification

The connected brand has no `started checkout` or `placed order` events yet. No recovery automation has been enabled or sent.

1. Publish a verified server event after a real owned checkout is created, carrying a stable checkout identifier, correct currency/total, product details, and an expiring recovery URL. Do not send the browser session cookie or raw payment URL to analytics.
2. Only enroll recipients whose email marketing status permits this message. Keep email and SMS consent separate; a phone number alone is not SMS consent.
3. Wait one hour without checkout activity. Exit immediately on the matching paid-order event. Recheck order state before sending; cap entry to once per 24 hours.
4. Use a cart recovery email section. Subject: `Your rotation is still here`. Body: `Return to your bag and check the current sizes, delivery estimate and total.` CTA: `RETURN TO BAG`.
5. Restoring a bag must revalidate current availability, pricing and shipping. A saved bag is not a stock reservation. Do not promise limited stock without a real stock source.
6. Validate with a consented internal test contact and a sandbox checkout before enabling. A paid order must cancel recovery reliably, including delayed-payment completion.

## Indexing

The connected Search Console account did not expose a verified `hustlerdior.com` property. A similarly named `.co` property is a different domain. Verify `.com` ownership before submitting `https://hustlerdior.com/sitemap.xml`. Keep preview deployments and any backup sites out of the index.

## Catalog

The saved `hustler-dior-streetwear-150.csv` contains 188 draft rows. Every row has a placeholder quantity of 25 and an empty image source. Retail prices range from $26 to $148, and listed costs are research estimates. The GSM column contains values, but supplier confirmation is absent. These rows must remain unpublished until actual SKUs, image rights, fulfillment, availability, material specifications and landed costs are verified.
