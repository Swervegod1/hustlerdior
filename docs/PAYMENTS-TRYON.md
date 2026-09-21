# Checkout and fitting-room operations

The source is deployed on https://hustlerdior.com as a Hostinger Node 22 zip. Checkout UI stays disabled until a valid `STRIPE_SECRET_KEY` is present. Stripe Tax, PostgreSQL and `CHECKOUT_ENABLED=true` are no longer required to open quotes and hosted Checkout. Try On remains off until its own credentials are set. Account readiness in the Stripe Dashboard does not establish storefront readiness, and this repository does not contain secret values.

## Hosted checkout

The storefront collects delivery information on `/checkout`, refreshes real Printful prices/availability, and calls the Printful estimate endpoint for the selected basket and US address. It stores an immutable order snapshot in PostgreSQL when `DATABASE_URL` is set; otherwise the snapshot stays in process memory and is also written into Stripe Checkout Session metadata so a paid webhook can recover it after a Hostinger process restart. The browser gets retail totals, not the merchant’s private production costs.

`POST /api/checkout` accepts only that quote’s ID. A signed HttpOnly cookie binds the quote to its browser. Stripe customer and Checkout Session creation use stable per-order idempotency keys. The customer sees Stripe-hosted payment using dynamic payment methods. Shipping goes to the exact address already reviewed and quoted on the store; changing it requires a new quote.

Stripe Tax is optional. `STRIPE_TAX_MODE=automatic` uses active Stripe Tax settings, a configured default tax code and at least one active registration when those are present. If they are missing, checkout continues with automatic tax left off rather than returning “being prepared.” Registrations determine where tax is actually collected; the code does not register jurisdictions or establish tax obligations. Review your catalog’s tax classifications in Stripe, including whether its default tax code is appropriate for every sold product. There is no invented tax amount.

Read-only inspection found one connected Stripe business account with charges and payouts enabled, but **zero active Stripe Tax registrations** on September 13, 2026. The connector account does not supply the storefront’s runtime API key. No tax registration, business profile, live product, charge or payment session was created during development.

### Environment and migrations

Provide `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the exact deployed `SITE_URL` using protected runtime configuration. `PRINTFUL_API_TOKEN` or `PRINTFUL_API_KEY` plus `PRINTFUL_STORE_ID` are required for quotes and fulfillment. `DATABASE_URL` and `APP_SESSION_SECRET` are optional on Hostinger: sessions can fall back to the Stripe secret, and paid orders recover from Checkout Session metadata. Use a restricted Stripe key with only the necessary customer, Checkout Session, payment/charge read, and Tax settings/registration read permissions, or equivalent approved server credentials. Webhook management credentials should stay outside the public application. `NEXT_PUBLIC_*` Stripe keys are not used.

Use a PostgreSQL database with appropriate access controls, verified TLS where remote, encrypted backups and a tested restore procedure. The local tests use PGlite to exercise PostgreSQL SQL; PGlite is not the production order store.

```bash
npm ci
npm run db:migrate
npm run build
npm start
```

The build also creates `.next/standalone/payment-worker.mjs`, which runs without tsx or other development packages. From the source project:

```bash
npm run orders:work
```

From inside the standalone deployment directory or Docker image:

```bash
node --conditions=react-server payment-worker.mjs
```

Run a bounded worker pass at least once a minute using a reliable scheduler you control when PostgreSQL is attached. On Hostinger Node the Stripe webhook also fulfills immediately, so a missing scheduler does not leave a paid order unsubmitted. Keep the disabled checkout UI until `STRIPE_SECRET_KEY` is actually set. The application acknowledges webhooks after attempting fulfillment (and after queue insert when a database is present).

To reconcile a known order manually using protected server credentials:

```bash
npm run orders:work -- ORDER_UUID
```

This re-fetches Stripe proof and may create the order’s deduplicated Printful draft; it never forces payment success or confirms billable production.

### Stripe webhook

After the HTTPS app is reachable, configure a Stripe webhook destination at:

`https://hustlerdior.com/api/webhooks/stripe`

Match the pinned SDK’s API version, `2026-08-26.dahlia`, and subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Add that destination’s signing secret to the host. Do not point live events at a parked domain. Signature verification uses the original raw bytes and the Stripe SDK’s timestamp/signature checks. Event IDs deduplicate queue insertion.

### Fulfillment and exceptions

The worker fetches the actual Checkout Session, PaymentIntent, Charge and line items. It verifies captured payment, test/live mode, order references, amounts, currency, quantity/variant identity, delivery address, completed automatic tax calculation when enabled, and the absence of a refund/dispute. A redirect or browser-provided `paid` flag cannot authorize production.

Valid payment is saved before the Printful draft request. A stable external ID allows duplicate deliveries or lost responses to reconcile the same draft. Price/stock changes after payment can put the order into review. Jobs retry with backoff, carry expiring leases/fencing tokens, and move unresolved orders to manual review after eight attempts. Monitor unresolved jobs and paid orders that do not yet have a draft.

**Printful draft creation is not final production.** Final confirmation remains an operator action after reviewing costs and the order. There is no automatic merchant charge, refund automation, returns workflow, shipment-tracking dashboard or support-email service in this foundation. Those operating steps need a real owner before public sales. Keep Stripe receipts and fulfillment records as the source of truth when the browser loses its session cookie.

### Margin protection

`MIN_CONTRIBUTION_RATE=0.35` defaults to blocking quotes below a modeled 35% contribution margin on product-plus-shipping revenue after the Printful estimate, assumed processing fees and a 3% product-revenue returns reserve. It is before advertising, AI usage, overhead and fee/tax differences; it is not a guarantee of net profit. The guard does not change Printful prices. The existing pricing review found many negative-contribution samples: review the actual retail prices before opening checkout, rather than exposing customers to preventable quote failures.

## AI fitting room

Try On buttons appear on product cards, product option/detail views and optional add-ons. The dialog supports a file upload or explicit camera access, selected color/size, consent, generation status and a downloadable AI preview. The generation UI never substitutes an ordinary mockup for a successful AI response.

- File types: JPEG, PNG or WebP; maximum 8 MB and 20 million decoded pixels; single static frame, at least 256×256.
- Images are decoded/re-encoded, auto-oriented and resized to at most 1536 pixels per axis; EXIF/location metadata is removed.
- The server retrieves the selected product image only from allowlisted Printful hosts and refuses redirects.
- Requests require the store’s exact origin and a valid signed browser session. PostgreSQL usage counters apply across application replicas.
- Three generation attempts per signed session per UTC day; a separate global daily generation-attempt ceiling; request limits also bound upload/processing traffic.
- OpenAI requests use two image references, a fixed garment-preservation prompt, one output and no automatic retry. A timed-out call may have processed, so its attempt remains consumed.
- The application does not persist photos/results in its database or application logs. OpenAI’s own processing/retention policies still apply and are linked visibly before generation.
- Camera tracks stop after capture/close; local preview URLs are released on replacement/close. A result is a styling visualization, not proof of sizing, fit, logo fidelity or exact garment appearance.

The implementation uses the current documented `images.edit` interface and `gpt-image-2.5-sunburst` by default. `TRYON_MODEL` is a server-side setting. [OpenAI image-generation/editing guide](https://developers.openai.com/api/docs/guides/image-generation)

Runtime variables: `OPENAI_API_KEY`, `TRYON_ENABLED`, `TRYON_MODEL`, `TRYON_DAILY_LIMIT`, `DATABASE_URL`, `APP_SESSION_SECRET` and `SITE_URL`. The runtime key must be delivered through secure key setup; the required trusted local OpenAI key-setup skill was not installed here, so no key was created. No secrets are embedded in the client or downloadable archive.

`TRYON_DAILY_LIMIT=0` keeps generation disabled. Set an explicit attempt budget only after provider access and spend controls are configured. This is an attempt cap, not an exact dollar cap. Production generation was not tested because the runtime image credential is absent and this environment’s Printful image CDN returned 403. Verify the image fetch, actual inference, camera permission and download on the deployed HTTPS site with an authorized test photo.

The route allows up to 180 seconds and the image provider request times out after 110 seconds. Confirm the chosen Hostinger plan/reverse proxy supports this request duration. Use a durable image job service with private expiring result storage if the host requires short requests; no such photo-storage service has been provisioned.

## Brand moment and add-ons

`Arrival.tsx` uses a 4.7-second T-shirt entrance displaying HUSTLERDIOR, then a slow slide downward. It runs once per browser session, can be skipped with the visible button or Escape, can be replayed, and is bypassed for reduced motion. It is a brand graphic, not an automatically created Printful product.

“Complete the look” selects up to three available complementary catalog products, excludes products already in the bag, shows real prices and opens real size/color selection. Nothing is preselected for purchase or automatically added. No fabricated scarcity, countdown or discount is used.

See [AI-REVENUE-REVIEW.md](AI-REVENUE-REVIEW.md) for the GitHub/Hugging Face shortlist, commercial licensing checks and a measurable experimentation plan.
