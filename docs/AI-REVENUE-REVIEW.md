# AI APIs and revenue experiments for Hustler Dior

Checked September 13, 2026. These are researched recommendations; none of these additional paid services has been purchased or connected. Revenue effects below are hypotheses to measure against the current storefront.

## Best additional APIs

| Priority | API              | Proposed Hustler Dior experience                                                                                                                  | Published usage cost and material limits                                                                                                                                                                                                                                                                                                                           | Revenue experiment                                                                                                                       |
| -------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | Groq             | A quick stylist: “Build a black outfit under $100.” Return actual available products, sizes and an optional complete-look bag.                    | GPT OSS 120B: $0.15 per million input tokens and $0.60 per million output tokens. Tool calls require application logic and can add inference rounds. [Models and prices](https://console.groq.com/docs/models), [tool calling](https://console.groq.com/docs/tool-use/overview)                                                                                    | Compare paid orders and contribution per eligible visitor with ordinary navigation.                                                      |
| 2        | FASHN hosted API | Compare a dedicated fashion model with the current image-editing Try On adapter. Try-On Max accepts clothing and accessories plus a person photo. | Max costs 1–5 credits per image depending on quality/resolution; default balanced 1K is 2 credits. The dollar price of API credits could not be verified from the accessible official pricing page. Max is marked Preview. [Endpoint and credit table](https://docs.fashn.ai/api-reference/tryon-max), [API pricing entry](https://fashn.ai/pricing)               | Measure completed previews, purchases and logo fidelity. A generated appearance preview does not measure physical fit.                   |
| 3        | Runway           | Turn an approved outfit image into a five-second concrete-and-chrome fashion clip, with an optional shop-the-look share link.                     | Gen-4 Turbo costs 5 credits/second; credits cost $0.01. A five-second generation therefore costs $0.25. Rerenders are additional generations. [Prices](https://docs.dev.runwayml.com/guides/pricing/), [supported image-to-video models](https://docs.dev.runwayml.com/guides/models/)                                                                             | Start with reusable campaign clips; then test an explicitly requested personal clip for referral traffic and attributable orders.        |
| 4        | Meshy            | Generate an interactive 3D cap, bag or original brand artifact that shoppers can rotate in the existing Three.js scene.                           | Meshy 6/7 image-to-3D and multi-image-to-3D cost 30 credits with standard textures. API usage is prepaid; the cash price of the required credit package and account entitlement remain to be confirmed. [API pricing](https://docs.meshy.ai/en/api/pricing), [multi-image GLB output](https://docs.meshy.ai/en/api/multi-image-to-3d)                              | Produce and inspect assets once, then serve optimized cached GLBs. Measure engagement and orders without per-visitor generation charges. |
| 5        | Photoroom        | Give approved product photos consistent concrete backgrounds, clean cutouts and editorial shadows.                                                | Image Editing API Plus lists $0.10 per successful call. It uses monthly image packages; unused images do not roll over. Confirm the selected package minimum before buying. A 1,000-call monthly sandbox has watermarked results. [Pricing](https://www.photoroom.com/api/pricing), [Plus billing](https://docs.photoroom.com/image-editing-api-plus-plan/pricing) | Improve the top products and compare add-to-bag rate. Preserve garment color, artwork and construction in the product cutout.            |
| 6        | Recombee         | Personalize “complete the look” suggestions using product views, cart additions and purchases.                                                    | A free plan is listed; Standard starts at $99/month. The free column lists fewer than 100,000 monthly interactions and recommendation requests, and fewer than 20,000 active users/catalog items. Usage limits and optional features matter. [Pricing](https://www.recombee.com/pricing), [recommendation features](https://www.recombee.com/features)             | Compare against the existing real-catalog suggestions. Delay paid plans until visitor volume supports a useful test.                     |

The strongest proposed customer journey is: choose a budget and style, see an outfit built from available inventory, explicitly upload a photo to preview a selected garment, request a short clip, then share or shop the selected pieces. Sharing needs separate consent; photos should never become public automatically. This sequence still needs implementation and provider credentials.

## Commercial and product choices

FASHN's hosted service explicitly permits customer-facing API integrations and commercial use under its terms, with output rights assigned to the customer to the extent applicable law permits. That paid service is distinct from the open-source VTON 1.5 pipeline discussed below. FASHN says customer content is not used for training without a separate opt-in arrangement. Its privacy documentation gives CDN output availability of three days, or up to 60 minutes for base64 output delivery; request metadata remains. [Terms](https://fashn.ai/legal/terms-of-service), [retention details](https://docs.fashn.ai/api-overview/data-retention-privacy)

Runway's attribution guidance uses a linked “Powered by Runway” notice. Check the applicable account agreement during integration and include the required branding. Review video outputs for drifting logos, changed garments and invented details before using them as product marketing. [Attribution](https://docs.dev.runwayml.com/usage/attribution/)

For Meshy, generated geometry is an approximation. A single front photo cannot verify the garment's back, stitching or measurements. Use multiple approved views where possible, retain original product photos and optimize the GLB before mobile delivery. Confirm the commercial rights attached to the actual API account; web-app plan terms alone do not establish an API entitlement.

Recraft is a seventh candidate for original graphic concepts and custom-drop experiments. Its API currently lists V4 Styles Vector at $0.05 per image and V4 Vector at $0.08. However, its Developer Terms include a 30-day local caching restriction and a restriction on persistent content repositories. I would clarify how those clauses apply to permanent print artwork before building a print-on-demand customization feature around it. Do not substitute the consumer subscription's ownership summary for the API agreement. [API prices](https://www.recraft.ai/docs/api-reference/pricing), [Developer Terms](https://www.recraft.ai/legal/developer-terms)

## Practical pilot and cost model

Launch valid checkout and margin-reviewed products first. Keep AI behind explicit shopper actions, with server-only credentials, a durable usage ledger and a fixed model/quality configuration. Do not generate paid media on every page load or automatically retry an uncertain paid request.

A metered-cost example using the published rates above:

| Workload                                                                                                             | Calculation                             | Estimated model usage |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | --------------------- |
| 1,000 stylist interactions, averaging 3,000 total input and 500 total output tokens across all calls per interaction | 3 million × $0.15 + 0.5 million × $0.60 | $0.75                 |
| 100 five-second Gen-4 Turbo clips                                                                                    | 100 × 5 × 5 credits × $0.01             | $25.00                |
| Combined example                                                                                                     | Sum of those two workloads only         | $25.75                |

This is not a provider invoice or an all-in pilot price. It excludes the input try-on image, failed/repeated attempts where charged, funding minimums, subscriptions, tax, storage, bandwidth, moderation and engineering. FASHN and Meshy are not included because their applicable cash credit package prices remain unverified.

A proposed initial experiment ceiling is $100 of incremental AI and media expense, subject to selecting services and confirming their actual billing controls. Nothing has been purchased. At a hypothetical $18 contribution per incremental paid order, six additional orders cover $100 of added cost before extra support or return expense. This is arithmetic, not a revenue forecast.

Track contribution per eligible visitor, paid conversion, add-on attachment, AOV, refund/return cost, actual cost per accepted preview, and generated-clip referral orders. Keep a comparison group. Retain a feature when incremental contribution exceeds its total incremental cost.

## Connection to the existing Hostinger code

The current site already has camera/upload Try On controls, optional complementary products, signed sessions, durable generation limits and payment verification code. The new APIs would sit behind server routes and background jobs. Keep Printful as the source of its own product/variant IDs; new wholesale items need their own inventory and fulfillment adapter.

For the stylist, allow only catalog lookup and proposal of known product IDs. The server must recompute prices, validate stock and require the shopper to choose variants and confirm additions. A language model must not invent discount eligibility, delivery promises, supplier authenticity or inventory.

For media jobs, keep provider job IDs in a durable queue, give each shopper access only to their own results, strip input metadata and expire private images. Do not send an uploaded customer photo to a second provider unless the feature's consent and privacy notice cover that processing.

## Earlier GitHub and Hugging Face review

The earlier model research and source implementation notes follow. They remain useful alternatives for a future self-hosted experiment, not additional services already installed.

Research checked September 13, 2026. The choices below are an implementation shortlist, not promises of increased revenue. GitHub stars and model benchmark scores do not establish shopping conversion or garment accuracy.

## Recommended order

1. Finish the existing photo/camera Try On flow and measure its cost per completed preview and contribution per visitor. The current source integrates OpenAI image edits, not a public Hugging Face demo. It sends the actual selected garment and an explicitly submitted customer photo, applies durable request/generation limits, and keeps photos out of the application database.
2. Add visual similarity and natural-language product discovery once catalog images load reliably from the deployed host. Marqo-FashionSigLIP is the strongest fashion-specific shortlist option for that experiment.
3. Consider Qwen3-Embedding for text search and retrieval of approved ordering/fit answers. Keep all price, stock, shipping and refund claims grounded in the store’s actual data.

## Models and commercial deployment findings

| Candidate                             | Useful storefront feature                                                    | Evidence and limitation                                                                                                                                                                                                                                                                                                                | Decision                                                                                                                                                                                                             |
| ------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marqo-FashionSigLIP                   | Find similar pieces; search with descriptions of style, color or silhouette  | The published model card describes fashion-specific multimodal embeddings and labels the model Apache 2.0. It links OpenCLIP and Transformers.js usage. [Model card](https://huggingface.co/Marqo/marqo-fashionSigLIP), [maintainer repository](https://github.com/marqo-ai/marqo-FashionCLIP)                                         | Pilot against actual catalog images and search queries. This public model is available now, but is not presented here as a newly released 2026 model.                                                                |
| Qwen3-Embedding-0.6B                  | Meaning-based product search and matching questions to approved help content | The model card lists Apache 2.0 and text embedding interfaces; the repository identifies the series’ 2025 research. It is a text retrieval model, not a clothing image generator. [Model card](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B), [repository](https://github.com/QwenLM/Qwen3-Embedding)                              | Lower priority until enough search traffic exists to compare with ordinary catalog search.                                                                                                                           |
| FASHN VTON 1.5                        | Garment-specific person-photo try-on                                         | The 2026 core model is Apache 2.0. Its model card reports roughly 8 GB VRAM, 576×864 output, and body-shape/garment-transition limitations. There was no listed Hugging Face Inference Provider at review time. [Model card](https://huggingface.co/fashn-ai/fashn-vton-1.5), [repository](https://github.com/fashn-AI/fashn-vton-1.5) | Conditional research candidate; the bundled parser creates a separate commercial licensing issue described below. Do not install the complete default pipeline in this store as if every dependency were Apache 2.0. |
| CatVTON / default published materials | Image try-on research                                                        | The maintainer says code, checkpoints and demo are CC BY-NC-SA 4.0 for noncommercial use. [Repository license section](https://github.com/Zheng-Chong/CatVTON#license)                                                                                                                                                                 | Exclude from this commercial storefront unless separate commercial rights are obtained.                                                                                                                              |

The FASHN Human Parser wrapper says the underlying model inherits the NVIDIA Source Code License for SegFormer. Section 3.3 of that license limits use to research or evaluation for non-NVIDIA users. This is why the top-level Apache badge alone is insufficient for the bundled pipeline. A separately licensed/replaced parser, or a contracted commercial service with the needed rights, would require review before adoption. [Parser license](https://github.com/fashn-AI/fashn-human-parser/blob/main/LICENSE), [SegFormer license](https://github.com/NVlabs/SegFormer/blob/master/LICENSE)

Marqo’s current public model card also advertises a newer Fashion SigLIP 2 through a contact/demo route. Its vendor benchmark claim is not a measured revenue result for Hustler Dior, and no public weight/license/deployment entitlement was verified for that newer version. No sales inquiry or purchase was sent.

## How the next search experiment would connect

An offline catalog job should create embeddings from approved product images and visible product information. Store product IDs, embedding vectors and the exact model revision. A search request can rank that index, then load current Printful products and remove unavailable variants. Similarity scores must never replace real prices, stock, size choices or user consent to add items. Add-on suggestions should exclude pieces already in the bag and keep every addition optional.

Run inference in a dedicated service appropriate to the model; do not make every shopper download large model weights to view the storefront. A standard Hostinger Node app should call that service over an authenticated, fixed HTTPS destination. No GPU service, model download, public demo dependency, subscription or new hosting account was provisioned during this work.

For model evaluation, pin the exact repository revision and dependency versions, retain license notices, and inspect custom code before enabling `trust_remote_code`. Evaluate small logos, text placement, dark-on-dark prints, body-shape preservation, varied skin tones and garment transitions. Use authorized evaluation photos, not scraped customer photos.

## Revenue measurement and budget

Measure these outcomes per eligible visitor: product-view-to-add rate, complementary-item attachment rate, completed paid orders, average order value, contribution after fulfillment/fees/returns, preview completion rate, and actual image-generation cost. Keep the existing catalog experience as a comparison group. Count verified payments, not checkout redirects.

A useful spending rule is:

`incremental contribution = added paid orders × contribution per order − AI inference cost − added infrastructure cost − added support/returns cost`

Illustration only: 1,000 previews at an assumed $0.08 each cost $80. If contribution is $18 per incremental order, at least 5 additional orders are needed just to cover that $80, before fixed hosting/support costs. These are hypothetical values, not quoted provider prices or a forecast. Replace them with actual bills and store order data before changing spend limits.

The current fitting-room code defaults to disabled. When configured, it allows three generation attempts per signed browser session per UTC day and a separately configured global daily attempt limit. It does not automatically retry billable image requests. Attempt limits are not a dollar-denominated billing cap; provider budgets and observed per-preview costs also matter.

## Already in this source

- A skippable first-session HUSTLERDIOR shirt entrance, with reduced-motion support.
- Try On buttons on product cards, detail/options views and complementary pieces.
- Upload/camera consent, metadata removal, bounded image inputs, private responses and an AI-preview download.
- Optional real-catalog “complete the look” suggestions with visible prices and explicit size/color selection.
- A delivery quote and hosted checkout flow, payment verification, a durable fulfillment queue and margin guard. Runtime service configuration and live verification are still required.

No new model has been represented as installed or producing customer previews. The OpenAI image-editing integration is code-complete but still needs its server credential, enabled service budget and deployment verification. The secure local OpenAI key-setup skill was not available in this environment; no key was created or exposed.
