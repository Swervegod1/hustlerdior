"""Recalculate private pricing proposals from a completed Printful audit.
No provider writes. Run: python scripts/growth-report.py [output-directory]
"""
from pathlib import Path
from decimal import Decimal, ROUND_CEILING
from datetime import datetime, timezone
import collections
import csv
import json
import sys

root = Path(__file__).resolve().parents[1]
out = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'private-data/growth-report'
out.mkdir(parents=True, exist_ok=True)
audit = json.loads((root / 'private-data/margin-audit.json').read_text(), parse_float=Decimal)
assert audit.get('completedAt'), 'Only completed audits may be reported'
D = Decimal
RATE, FIXED, RESERVE, TARGET = D('0.029'), 30, D('0.03'), D('0.35')

def cents(value):
    amount = D(str(value)) * 100
    assert amount == amount.to_integral_value(), 'Expected whole cents'
    return int(amount)

def ceil(value):
    return int(value.to_integral_value(rounding=ROUND_CEILING))

def model(retail, charged_shipping, landed):
    revenue = retail + charged_shipping
    fees = ceil(D(revenue) * RATE) + FIXED
    reserve = ceil(D(retail) * RESERVE)
    contribution = revenue - landed - fees - reserve
    return contribution, D(contribution) / D(revenue), fees, reserve

def price_floor(landed, shipping):
    low, high = 1, 100000000
    while low < high:
        mid = (low + high) // 2
        if model(mid, shipping, landed)[1] >= TARGET:
            high = mid
        else:
            low = mid + 1
    ending_99 = ((low + 100) // 100) * 100 - 1
    assert model(ending_99, shipping, landed)[1] >= TARGET
    return ending_99

def cash(value):
    return ('-' if value < 0 else '') + '$' + f'{D(abs(value))/100:.2f}'

def pct(value):
    return f'{value*100:.1f}%'

def csv_safe(value):
    if isinstance(value, (int, Decimal)):
        return str(value)
    text = str(value or '')
    if text.lstrip().startswith(('=', '+', '-', '@')):
        text = "'" + text
    return text

rows = []
for r in audit['results']:
    assert r['costs']['currency'] == 'USD'
    landed, shipping, current = cents(r['costs']['total']), cents(r['costs']['shipping']), r['currentPriceCents']
    contribution, margin, fees, reserve = model(current, shipping, landed)
    floor = price_floor(landed, shipping)
    proposed = max(current, floor)
    suggested = model(proposed, shipping, landed)
    rows.append({
        'product_id': r['productId'], 'product': r['name'], 'variant_id': r['variantId'], 'size': r['size'], 'color': r['color'],
        'currency': 'USD', 'retail': current, 'subtotal': cents(r['costs']['subtotal']), 'shipping': shipping, 'landed': landed,
        'contribution': contribution, 'margin': margin, 'fees': fees, 'reserve': reserve, 'floor': floor,
        'free_shipping_floor': price_floor(landed, 0), 'proposal': proposed, 'proposed_contribution': suggested[0], 'proposed_margin': suggested[1],
        'quote_time': r['quotedAt'], 'category': r['category'], 'digitization': cents(r['costs']['digitization']),
    })
rows.sort(key=lambda r: (r['margin'], r['product_id'], r['variant_id']))
negative = sum(r['contribution'] < 0 for r in rows)
below = sum(r['margin'] < TARGET for r in rows)
groups = collections.defaultdict(list)
for r in rows:
    groups[r['product_id']].append(r)
summary = {
    'generated_at': datetime.now(timezone.utc).isoformat(), 'quoted_completed_at': audit['completedAt'],
    'planned_samples': audit['plannedSamples'], 'successful_estimates': len(rows), 'errors': len(audit['errors']),
    'sampled_products_with_quotes': len(groups), 'negative_samples': negative, 'below_35_percent_samples': below,
    'assumptions': {'processing_rate': str(RATE), 'fixed_cents': FIXED, 'returns_reserve_rate': str(RESERVE), 'contribution_target': str(TARGET)},
    'method': 'Python Decimal; integer cents; processing and reserve rounded upward; .99 floors validated by binary search',
}
(out / 'Hustler-Dior-Margin-Summary.json').write_text(json.dumps(summary, indent=2) + '\n')
headers = ['Action','Printful store ID','Product ID','Product','Variant ID','Size','Color','Currency','Current retail','Production subtotal','Supplier shipping','Quoted supplier total incl tax/fees','Modeled contribution','Modeled contribution %','35% minimum with shipping charged','35% minimum with free shipping','Proposed retail (never below current)','Contribution at proposed retail','Contribution % at proposed retail','Quoted at']
with (out / 'Hustler-Dior-Price-Correction.csv').open('w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    for r in rows:
        writer.writerow([csv_safe(x) for x in [
            'REVIEW ONLY - NO PRICE CHANGE APPLIED', audit['storeId'], r['product_id'], r['product'], r['variant_id'], r['size'], r['color'], 'USD',
            cash(r['retail']), cash(r['subtotal']), cash(r['shipping']), cash(r['landed']), cash(r['contribution']), pct(r['margin']),
            cash(r['floor']), cash(r['free_shipping_floor']), cash(r['proposal']), cash(r['proposed_contribution']), pct(r['proposed_margin']), r['quote_time'],
        ]])

shopify = json.loads((root / 'src/data/shopify-catalog.json').read_text())
quality = []
for p in shopify['products']:
    if not p['description'].strip() or p['description'].strip() == '#N/A':
        quality.append([p['id'], p['name'], 'Missing product description', 'Obtain factual supplier description before listing for sale'])
    if 'Jordan 1 Low' in p['name'] and 'Vapormax' in p['description']:
        quality.append([p['id'], p['name'], 'Title says Jordan 1 Low; description says Air Vapormax 2021', 'Verify exact supplier SKU, model, size and images before sale'])
with (out / 'Hustler-Dior-Inventory-Review.csv').open('w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['Product ID','Product','Issue','Required action'])
    writer.writerows([[csv_safe(x) for x in row] for row in quality])

def samples_table(product_id):
    lines = []
    for r in sorted(groups[product_id], key=lambda r: r['retail']):
        lines.append(f"| {r['size']} / {r['color']} | {cash(r['retail'])} | {cash(r['landed'])} | {cash(r['contribution'])} / {pct(r['margin'])} | {cash(r['proposal'])} | {cash(r['proposed_contribution'])} / {pct(r['proposed_margin'])} |")
    return '\n'.join(lines)

# Supplier scenarios: actual public quote for Trendsi US sweatshirt; explicit
# unknown landed quotes for other products. Never treat missing shipping as free.
zenana_retail, zenana_shipping, zenana_landed = 4999, 599, 1982 + 599
zenana_paid = model(zenana_retail, zenana_shipping, zenana_landed)
zenana_free = model(zenana_retail, 0, zenana_landed)

def maximum_landed(retail):
    fees = ceil(D(retail)*RATE) + FIXED
    reserve = ceil(D(retail)*RESERVE)
    return int((D(retail) * (1-TARGET) - fees - reserve).to_integral_value(rounding='ROUND_FLOOR'))

cami_ceiling = maximum_landed(2499)
cj_ceiling = maximum_landed(4999)

report = f'''# Hustler Dior — inventory, pricing and growth execution

Verified September 15, 2026. Financial calculations use Python Decimal and integer cents. This is an operating plan, not a revenue forecast.

## Immediate finding

**{negative} of {len(rows)} successful Printful estimates have negative modeled contribution at current retail prices. {below} are below the 35% target.** The audit requested {audit['plannedSamples']} representative variants; {len(audit['errors'])} requests failed. Successful estimates cover {len(groups)} products. Prices are proposals only; no provider retail price or stock quantity was changed.

Keep checkout and paid acquisition off until the launch assortment is repriced and actual destinations/baskets pass the quote guard. Raising traffic before fixing these prices would increase loss exposure or rejected quotes. The CSV supplies variant IDs, current retail, supplier quotes and proposed floors for every successful sample.

The audit completed at {audit['completedAt']}. It estimates one unit at a fictional Virginia Beach, VA 23456 US address. It samples representative variants, **not every variant, basket or destination**. Two variants on product 471748994 returned HTTP 400 (5497843818 and 5497843821); their costs are unresolved.

## Inventory that is actually connected

| Source | Verified state | Sales readiness |
|---|---|---|
| Printful | 100 products and 2,444 variants in the accessible store 18747907 | Live catalog reads; checkout disabled; current pricing needs review |
| Shopify | 46 products and 399 variants imported and rechecked | All variants unavailable with zero quantities; no supplier unit costs returned |
| Other Printful stores | Working credential exposes one store | No claim that inaccessible stores were imported |
| Wholesale/dropship drafts | Existing supplier research inventory retained | Stock, resale access and landed costs must be confirmed before sale |

Shopify's 90-day sales query returned no rows, so these recommendations are based on assortment and unit economics, not a proven bestseller ranking. Shopify Payments readiness could not be read with the connected permissions; that is not evidence that it is inactive.

The Shopify edit contains 11 tees/tops, 3 layers, 6 bottoms, 12 footwear items, 8 accessories, 2 dresses/sets, 2 swimwear items and 2 fragrances. Explicit fit labels are 12 Women, 8 Men and 2 Unisex; 24 remain unspecified. No kids fit is invented from the Shopify data.

## First assortment to cost and test

**Start with the existing YUM YUM DRIP B&W heavyweight tee (Printful 471749169).** Its smaller sampled variant already has more contribution room than most audited products. Recheck every launch size/color before enabling it.

| Sample | Current retail | Quoted supplier total | Current contribution / rate | Proposed retail | Proposed contribution / rate |
|---|---:|---:|---:|---:|---:|
{samples_table(471749169)}

These rows charge the quoted $4.95 shipping to the customer. The contribution dollar amount is the theoretical acquisition-spend ceiling before overhead and other omitted costs; spend less than that to retain contribution. Do not use it as a profitable ad budget without accounting for actual returns, tax-service charges, fraud and overhead.

**Second candidate: the existing Men’s heavyweight tee (471749171).** Its base variant has a viable modeled starting point; larger sizes need a retail increase. Confirm the actual garment artwork and consumer-facing product name before a campaign.

| Sample | Current retail | Quoted supplier total | Current contribution / rate | Proposed retail | Proposed contribution / rate |
|---|---:|---:|---:|---:|---:|
{samples_table(471749171)}

The Gunz-n-Roses design has stronger sampled economics, but its name/artwork references need a merchandising review before promotion. Branded Shopify footwear and designer items also need supplier authenticity and resale documentation; an imported title is not verification.

## New product candidates matched to the assortment

| Candidate | Public supplier evidence | Retail test and economics | Decision |
|---|---|---|---|
| Trendsi Zenana acid-wash French terry pocket sweatshirt | $19.82 product + $5.99 US shipping; 100% cotton; S–L for the selected color; public page shows US dispatch | Proposed $49.99. With $5.99 shipping charged: {cash(zenana_paid[0])} / {pct(zenana_paid[1])} contribution before unquoted supplier tax/duties. Free-shipping scenario: {cash(zenana_free[0])} / {pct(zenana_free[1])} | Strongest sourced women's layer candidate; confirm account stock, exact color and final invoice; order a sample before listing |
| Trendsi ribbed square-neck cami | $9.05 dropship product price; 100% polyester; S–XL; displayed shipping was for Germany | At proposed $24.99 with free shipping, **all-in supplier cost must be ≤{cash(cami_ceiling)}** for 35% modeled contribution | Potential low-ticket add-on only after a US landed quote; do not infer free US shipping |
| CJ loose zip cardigan hoodie, SKU CJWY236413901AZ | $12.11 selected White/M variant; cotton blend; M–2XL | At proposed $49.99 with free shipping, **all-in supplier cost must be ≤{cash(cj_ceiling)}** for 35% modeled contribution | Obtain warehouse/US shipping/stock quote and sample. Its shipping estimator's zero placeholder is not a shipping quote |

Supplier links: [Trendsi sweatshirt](https://www.trendsi.com/products/detail?id=395508&name=Zenana+Acid+Wash+Raw+Edge+French+Terry+Sweatshirt+with+Front+Pocket&skuId=2630272), [Trendsi cami](https://www.trendsi.com/products/detail?id=392317&name=Ribbed+Square+Neck+Cami&skuId=2592824), [CJ zip hoodie](https://cjdropshipping.com/product/mens-solid-color-simple-loose-zip-cardigan-hoodie-p-2504280202101618100.html).

These are research drafts, not supplier accounts or orderable imports. Images already retained in supplier review files remain draft material pending resale/image-use rights. Tapstitch's [oversize fleece hoodie](https://www.tapstitch.com/custom/r00286-oversize-fleeced-hoodie?bsId=1356935091779162112) is an additional custom-apparel lead; this check did not establish an account-specific landed price. Sell The Trend and Foreplay are discovery/creative tools rather than fulfillment sources. No paid supplier subscription or order was purchased.

## Model, guardrails and interpretation

- Revenue = product retail + shipping collected, excluding customer sales tax.
- Processing assumption = 2.9% of that revenue, rounded up to cents, plus $0.30. This uses [Stripe's published standard US domestic-card pricing](https://stripe.com/pricing), not a negotiated account quote.
- Returns reserve = 3% of product retail, rounded up to cents.
- Contribution = revenue − full quoted Printful supplier total − processing − reserve.
- Rate = contribution ÷ product-plus-shipping revenue. This is a **contribution margin**, not markup or net profit.
- Target is 35%, a planning choice. Minimum-price columns round upward to .99 and are recalculated to clear the target. Proposed-retail column never lowers current prices.
- Printful total includes the returned supplier shipping, tax, fees and digitization. Digitization can differ on subsequent orders; re-estimate instead of assuming it always repeats or is always free.
- Excluded: ads, AI usage, overhead, subscriptions, chargebacks, currency/international-card surcharges, Stripe Tax service fees and processing on collected sales tax. Actual fees may be higher; configure and verify them before launch.
- Supplier scenarios outside Printful omit any tax/duties not shown on the public quote. The cami/CJ figures are maximum landed-cost ceilings, not confirmed margins.
- Do not apply one sample's cost to a whole size range. Quote every launch variant and representative single/multi-item domestic baskets. Keep private costs out of public product data.

## Plugin and AI execution

| Tool | Use now | Actual state / condition |
|---|---|---|
| Native Next.js cart | Explicit add-ons with real size/color and prices; fit-aware suggestions | Implemented; no auto-added products or fabricated urgency |
| Shopify connected app | Inventory inspection and cost/sales audit | Connected; complete import verified; supplier cost fields empty |
| Stripe connected app | Read-only payment-account audit | Account charges/payouts enabled, no currently-due or past-due requirements; storefront runtime integration still unconfigured |
| Omnisend | Segment and analyze consented drop audiences after orders can be taken | Suggested for connection; no account connected here, runtime automation installed or SMS sent |
| GSC Wizard | Read Search Console and GA4 reports to find indexed product/query opportunities | Suggested for connection; no property connection or search performance claim yet |
| FunnelKit / CartFlows / WordLift WordPress plugins | Appropriate only if migrating to a WordPress/WooCommerce backend | Not installed in this Next.js application; native cart/schema features already cover the immediate jobs |
| Tidio Lyro | Consider after publishing accurate fulfillment/returns answers and connecting order data | Not connected; no paid subscription started |
| AI try-on | Test whether completed try-ons improve checkout completion after payment launch | UI present; generation disabled pending provider credential, limits and real HTTPS end-to-end test |
| Hostinger tools | Existing app hosting, HTTPS, environment management and deployment | Current app deployed on the existing plan; no unsupported promise that Builder-only AI tools run inside Next.js |

Marketing automation should use real stock and declared drop windows. Example trigger: buyer has explicit SMS consent, selected launch SKU is available, no order for that drop, permitted sending window. Link to a signed, expiring server-side cart intent that revalidates price/stock; never put addresses or payment details in the URL. Stop reminders after purchase/unsubscribe. The Omnisend connector suggestion does not itself implement this workflow.

## Before the first real sale

1. Select a small cost-verified launch assortment and correct current provider retail prices. Validate all sellable sizes, shipping destinations and basket discounts with the quote guard.
2. Enter the application's restricted Stripe server key and webhook signing secret through protected Hostinger environment settings. Never place keys in browser code, source archives or chat.
3. Provision/attach PostgreSQL with tested backups; run migrations; configure the bounded order worker on supported infrastructure. Do not substitute an ephemeral local database for paid orders.
4. Verify appropriate Stripe Tax settings/registrations and product classifications; this audit does not determine tax obligations. Existing code refuses live test-only tax mode.
5. Configure signed payment webhooks and test successful/failed/expired payments, replayed events, quote expiry, stock/price changes and order reconciliation. Printful fulfillment currently creates a deduplicated draft; final production confirmation remains an operator action.
6. Only after these pass, enable checkout on hustlerdior.com. Validate a controlled live order with explicit purchase authorization. Then connect analytics/consented lifecycle campaigns and evaluate AOV, contribution per order, checkout completion and repeat purchase rate.

Do not scale on AOV alone: an add-on can increase order value while reducing contribution if shipping, discounts or fulfillment costs grow faster.

## Review files

- Hustler-Dior-Price-Correction.csv — {len(rows)} sampled variant proposals, including charged-shipping and free-shipping floors.
- Hustler-Dior-Inventory-Review.csv — missing/mismatched Shopify detail records that need supplier clarification.
- Hustler-Dior-Margin-Summary.json — reproducible aggregate results and arithmetic assumptions.

The live source release contains saved-piece controls, fit/budget/sort filters, privacy copy and corrected recommendation routing. Payment/AI service flags remain disabled and Shopify preview availability is preserved.
'''
(out / 'Hustler-Dior-Revenue-Execution.md').write_text(report)
print(json.dumps(summary, indent=2))
print('SUPPLIER_SCENARIOS', cash(zenana_paid[0]), pct(zenana_paid[1]), cash(zenana_free[0]), pct(zenana_free[1]), 'cami ceiling', cash(cami_ceiling), 'CJ ceiling', cash(cj_ceiling))
print('FILES', [p.name for p in sorted(out.iterdir())])
