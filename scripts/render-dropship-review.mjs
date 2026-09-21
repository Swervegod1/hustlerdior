import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import {
  stageDropshipCandidates,
  contributionScenario,
} from "../src/lib/dropship-candidates.ts";
import { stageWholesaleCandidates } from "../src/lib/supplier-candidates.ts";

const target = resolve(process.argv[2] || "private-data/dropship-review");
await mkdir(target, { recursive: true });
const rows = stageDropshipCandidates(
  JSON.parse(await readFile("inventory/dropship-candidates.json", "utf8")),
);
const existing = stageWholesaleCandidates(
  JSON.parse(await readFile("inventory/wholesale-candidates.json", "utf8")),
);
const leads = JSON.parse(
  await readFile("inventory/sourcing-leads.json", "utf8"),
);
const money = (c) => (c == null ? "Unconfirmed" : `$${(c / 100).toFixed(2)}`);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const csvCell = (s) => {
  const value = String(s ?? "");
  return `"${(/^[\s]*[=+@-]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;
};
const csv = (records, keys) =>
  [keys, ...records.map((r) => keys.map((k) => r[k]))]
    .map((r) => r.map(csvCell).join(","))
    .join("\r\n");

const reviewed = [];
await mkdir(resolve(target, "images"), { recursive: true });
for (const row of rows) {
  const us = row.supplierProductId === "395508" && row.supplier === "trendsi";
  const assumptions = {
    costCents: row.priceObservation.publicDropshipCents,
    shippingCents: us ? 599 : 899,
    dutyAllowanceCents: us ? 0 : 200,
    fixedFeeCents: 30,
    feeRate: 0.03,
    returnLossReserveRate: 0.08,
    targetContributionRate: 0.35,
  };
  const base = contributionScenario(assumptions);
  const stress = contributionScenario({
    ...assumptions,
    shippingCents: us ? 999 : 1499,
    dutyAllowanceCents: us ? 0 : 500,
  });
  const first = row.images.find((i) => i.status === "downloaded");
  let preview = null;
  if (first) {
    const bytes = await readFile(first.localFile);
    preview = `data:image/${first.localFile.endsWith(".jpg") ? "jpeg" : "webp"};base64,${bytes.toString("base64")}`;
    await copyFile(
      first.localFile,
      resolve(target, "images", basename(first.localFile)),
    );
  }
  reviewed.push({
    ...row,
    group: "new",
    preview,
    scenario: base,
    stressScenario: stress,
  });
}
const models = [
  ...reviewed,
  ...existing.map((row) => ({
    ...row,
    group: "existing",
    collection: "Existing S&S",
    priority: "hold",
    preview: null,
    source: { url: row.sourceUrl },
    scenario: null,
    stressScenario: null,
    material: null,
    observedSizes: row.optionResearch.sizes,
    observedColors: row.optionResearch.colors,
    priceObservation: null,
    notes: [
      "Existing S&S research preserved. Supplier images and account costs still require verification.",
    ],
  })),
];
const exportRows = reviewed.map((r) => ({
  candidate_id: r.candidateId,
  supplier: r.supplier,
  supplier_product_id: r.supplierProductId,
  observed_sku: r.observedSkuId,
  name: r.name,
  brand: r.brand,
  audience: r.audience,
  category: r.category,
  collection: r.collection,
  priority: r.priority,
  description: r.description,
  material: r.material,
  observed_sizes: r.observedSizes.join(" | "),
  observed_colors: r.observedColors.join(" | "),
  public_dropship_usd: (r.priceObservation.publicDropshipCents / 100).toFixed(
    2,
  ),
  actual_account_cost_usd: "",
  actual_shipping_usd: "",
  quantity_available: "",
  approved_retail_usd: "",
  scenario_test_price_usd: (r.scenario.testPriceCents / 100).toFixed(2),
  stress_test_price_usd: (r.stressScenario.testPriceCents / 100).toFixed(2),
  scenario_shipping_usd: (r.scenario.shippingCents / 100).toFixed(2),
  scenario_duty_allowance_usd: (r.scenario.dutyAllowanceCents / 100).toFixed(2),
  target_contribution_before_ads: "35%",
  payment_fee_assumption: "3% + $0.30",
  return_loss_reserve_assumption: "8% of revenue",
  source_url: r.source.url,
  evidence: r.source.evidence,
  checked_at: r.source.checkedAt,
  image_url: r.images[0]?.sourceUrl ?? "",
  image_file: r.images[0]?.localFile
    ? `images/${basename(r.images[0].localFile)}`
    : "",
  image_permission: "pending",
  status: "research-draft",
  sale_enabled: "false",
}));
const inventoryCsv = csv(exportRows, Object.keys(exportRows[0]));
await writeFile(resolve(target, "dropship-inventory.csv"), inventoryCsv);
await writeFile(
  resolve(target, "dropship-candidates.json"),
  JSON.stringify(rows, null, 2),
);
await writeFile(
  resolve(target, "existing-wholesale-candidates.json"),
  JSON.stringify(existing, null, 2),
);
await writeFile(
  resolve(target, "sourcing-leads.json"),
  JSON.stringify(leads, null, 2),
);
await writeFile(
  resolve(target, "pricing-scenarios.json"),
  JSON.stringify(
    reviewed.map(({ candidateId, scenario, stressScenario }) => ({
      candidateId,
      scenario,
      stressScenario,
      approvedRetailPriceCents: null,
    })),
    null,
    2,
  ),
);

const cards = models
  .map(
    (
      r,
      i,
    ) => `<article class="card" data-row="${i}" ${r.group === "existing" ? "hidden" : ""}>
  <div class="photo">${r.preview ? `<img src="${r.preview}" alt="Supplier gallery image: ${esc(r.name)}. Color-to-variant mapping is unverified." loading="lazy" width="800" height="1000">` : `<div class="missing"><span>HD / SOURCING</span><strong>Image pending</strong><small>${r.group === "existing" ? "Existing S&S candidate" : "Supplier photo required"}</small></div>`}<span class="collection">${esc(r.collection)}</span></div>
  <div class="card-body"><div class="meta">${esc(r.audience)} / ${esc(r.category)} <span>${r.supplier === "trendsi" ? "TRENDSI" : r.supplier === "cj-dropshipping" ? "CJ" : "S&S"}</span></div>
  <h2>${esc(r.name)}</h2><p class="brand">${esc(r.brand || "Brand unconfirmed")}</p>
  <div class="prices"><div><small>Public item cost</small><strong>${money(r.priceObservation?.publicDropshipCents)}</strong></div><div><small>Scenario test price*</small><strong>${r.scenario ? money(r.scenario.testPriceCents) : "Unconfirmed"}</strong></div></div>
  <button class="detail" data-open="${i}">Review product <span aria-hidden="true">↗</span></button></div></article>`,
  )
  .join("");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Hustler Dior — Inventory Expansion</title><style>
*{box-sizing:border-box}body{margin:0;background:#10120f;color:#edeee7;font:15px/1.5 Arial,Helvetica,sans-serif}button,input,select{font:inherit}button,a,input,select{outline-offset:5px}a{color:inherit}button{cursor:pointer}.wrap{max-width:1520px;margin:auto;padding:0 4vw}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #3a3e33;padding:20px 0;gap:20px}.wordmark{font-size:24px;font-weight:900;letter-spacing:-1px}.eyebrow,.tag,.meta,.collection{font-size:10px;letter-spacing:1.5px;text-transform:uppercase}.eyebrow{color:#c4df81}.hero{padding:50px 0 35px;display:grid;grid-template-columns:1.45fr 1fr;gap:50px;align-items:end}h1{font-size:clamp(46px,7vw,105px);line-height:.94;letter-spacing:-5px;margin:15px 0 24px;font-weight:900}h1 em{font-style:normal;color:#c4df81}.intro{max-width:540px;color:#b7beaf;font-size:16px}.hero-aside{border-left:1px solid #414739;padding-left:28px}.stats{display:flex;gap:38px;margin:25px 0}.stats strong{display:block;font-size:38px;line-height:1.2}.stats small{color:#b7beaf}.status{padding:14px 18px;border:1px solid #45532f;background:#222d1b;color:#dae7bf;font-size:13px}.tools{position:sticky;top:0;z-index:2;background:#10120ff5;padding:20px 0 15px;border-top:1px solid #3a3e33;border-bottom:1px solid #3a3e33}.controls{display:flex;gap:10px;flex-wrap:wrap;align-items:center}input,select{background:#20251c;border:1px solid #4c5443;color:#f0f0e8;padding:11px 12px;border-radius:0;max-width:100%}input{flex:1;min-width:170px}button.pill{background:transparent;border:1px solid #4b5540;color:#e6ecdf;padding:10px 16px;border-radius:0}button.pill[aria-pressed=true],button.accent{background:#c4df81;color:#10120f;border-color:#c4df81}.count{margin:15px 0 0;color:#b2bba9;font-size:12px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;padding:26px 0 50px}.card{border:1px solid #30372a;background:#171c14;min-width:0}.photo{aspect-ratio:4/5;position:relative;overflow:hidden;background:#eeece6}.photo img{width:100%;height:100%;object-fit:contain;display:block}.collection{position:absolute;bottom:12px;left:12px;background:#10120f;color:#e9ede1;padding:7px 10px}.missing{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:repeating-linear-gradient(130deg,#20281a 0,#20281a 1px,#1a2116 1px,#1a2116 25px);color:#b4c39e;gap:12px;text-align:center}.missing strong{font-size:24px}.missing span{font-size:10px;letter-spacing:3px}.card-body{padding:17px}.meta{display:flex;justify-content:space-between;color:#c4df81;gap:10px;letter-spacing:.7px}.meta span{color:#929e85}h2{font-size:16px;line-height:1.3;margin:15px 0 7px;min-height:62px}.brand{font-size:12px;color:#a7b29b;margin:0 0 16px;min-height:18px}.prices{display:grid;grid-template-columns:1fr 1fr;gap:12px;border-top:1px solid #37402c;padding-top:13px}.prices small{display:block;color:#a7b29b;font-size:10px}.prices strong{font-size:18px;display:block;margin:3px 0 14px}.detail{width:100%;display:flex;justify-content:space-between;border:1px solid #4b583f;background:transparent;color:#e9eddf;padding:10px 12px;font-size:12px}.detail:hover{background:#c4df81;color:#12150e}.note{color:#b7beaf;max-width:1000px;font-size:13px}.strategy{display:grid;grid-template-columns:1fr 1fr;gap:40px;padding:35px 0;border-top:1px solid #394330}.strategy h2{min-height:0;font-size:25px}.strategy li{margin:12px 0;color:#bbc7ad}.lead{padding:12px 0;border-top:1px solid #34402a}.lead strong{display:block}.lead small{color:#a7b29b}.lead a{display:inline-block;color:#c4df81;margin-top:6px}footer{padding:30px 0;color:#9dad8f;border-top:1px solid #37432c;font-size:12px}dialog{background:#f1f0e9;color:#17200e;border:0;max-width:960px;width:92vw;max-height:90vh;padding:0}dialog::backdrop{background:#000b}.dialog-head{padding:14px 22px;background:#c4df81;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:1}.dialog-head button{border:1px solid #45572c;background:transparent;padding:5px 14px}.dialog-content{padding:26px;display:grid;grid-template-columns:1fr 1.15fr;gap:28px}.dialog-content img{width:100%;height:auto;max-height:500px;object-fit:contain;background:#e7e7df}.dialog-content h2{font-size:25px;min-height:0;margin-top:0}.dialog-content p,.dialog-content li{font-size:13px}.dialog-content ul{padding-left:18px}.dialog-content .status{background:#e1e8d2;color:#29371c}.facts{display:grid;grid-template-columns:1fr 1.3fr;font-size:12px;margin:20px 0}.facts dt,.facts dd{border-top:1px solid #cad0c0;margin:0;padding:8px 0}.facts dt{color:#576549}.facts dd{padding-left:12px;font-weight:bold;overflow-wrap:anywhere}.source-button{display:block;background:#1c2b13;color:#f2f4eb;padding:13px;text-align:center;text-decoration:none}.empty{padding:40px;border:1px solid #47583a}[hidden]{display:none!important}@media(max-width:1100px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}.hero{gap:25px}h1{letter-spacing:-3px}}@media(max-width:750px){.hero{grid-template-columns:1fr;padding-top:25px}.hero-aside{border-left:0;padding-left:0}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.card-body{padding:12px}h2{font-size:14px;min-height:72px}.meta{font-size:9px}.prices strong{font-size:16px}.tools{position:static}.strategy,.dialog-content{grid-template-columns:1fr}.top .tag{display:none}.dialog-content{padding:20px}.photo{aspect-ratio:3/4}h1{letter-spacing:-2px}.stats{gap:25px}.prices{grid-template-columns:1fr}.prices strong{margin-bottom:7px}.collection{font-size:9px;left:7px;bottom:7px}}
</style></head><body><div class="wrap"><header class="top"><div class="wordmark">HUSTLERDIOR<span style="color:#c4df81">✦</span></div><div class="tag">Buying desk / September 14, 2026</div><button class="pill accent" id="export">Export 22 drafts ↓</button></header>
<section class="hero"><div><div class="eyebrow">The inventory expansion / 001</div><h1>FIND YOUR<br><em>OTHER SIDE.</em></h1><p class="intro">Graphic layers. Unexpected textures. A playful next generation. Three capsule directions for a more distinctive Hustler Dior selection.</p></div><div class="hero-aside"><div class="stats"><div><strong>22</strong><small>new buying drafts</small></div><div><strong>17</strong><small>supplier photos</small></div><div><strong>10</strong><small>existing styles kept</small></div></div><p class="status">PRIVATE INVENTORY REVIEW · These products are staged for review. Supplier accounts, live stock, shipping, rights, and fulfillment must be connected before sale.</p></div></section>
<section class="tools" aria-label="Inventory filters"><div class="controls"><button class="pill" data-group="new" aria-pressed="true">New 22</button><button class="pill" data-group="existing" aria-pressed="false">Existing 10</button><button class="pill" data-group="all" aria-pressed="false">All 32</button><input id="search" type="search" placeholder="Search products, fabric, supplier…" aria-label="Search inventory"><select id="audience" aria-label="Audience"><option value="">All audiences</option><option>Women</option><option>Men</option><option>Kids</option><option>Unisex</option></select><select id="category" aria-label="Product type"><option value="">All product types</option>${[
  ...new Set(models.map((r) => r.category)),
]
  .sort()
  .map((v) => `<option>${esc(v)}</option>`)
  .join(
    "",
  )}</select><select id="priority" aria-label="Buying priority"><option value="">All priorities</option><option value="sample-first">Sample first</option><option value="add-on-test">Add-on test</option><option value="hold">Hold for details</option></select></div><p id="count" class="count" aria-live="polite">22 products shown · Public prices are observations, not account quotes.</p></section>
<main><div class="grid" id="grid">${cards}</div><p class="empty" id="empty" hidden>No matches. Change a filter or search term.</p>
<p class="note">*Scenario test prices target 35% contribution before advertising and overhead, using public item cost, 3% + $0.30 payment fees, an 8% revenue reserve for return losses, and assumed shipping/duties. These are pricing calculations, not approved selling prices or guaranteed profit. Open a card for the higher-cost scenario. Most overseas pages had Germany selected; their displayed free shipping is not a U.S. quote. Supplier images are for this private review; pictured colors are not mapped to sellable variants.</p>
<section class="strategy"><div><div class="eyebrow">Merchandising directions</div><h2>Give every piece a role.</h2><ul><li><strong>Concrete:</strong> washed denim, simple tanks, a retro polo, and muted knit accessories.</li><li><strong>After Hours:</strong> butterfly texture, hardware, statement graphics, harness boots, and angular eyewear.</li><li><strong>Playground:</strong> graphic cotton blends and illustrated sets, selected using real children's measurements.</li></ul><p class="note">Proposed add-ons: jacket + tank; tee + beanie; outfit + tote. Confirm combined shipping and per-item contribution before creating a discount. Extras should require an explicit customer choice.</p><h2>Creative tests from Foreplay research</h2><p class="note">Test an outfit transition, a fabric-and-fit close-up, and an itemized outfit carousel. These are hypotheses drawn from public streetwear ad examples, not verified sales winners.</p><a href="https://www.foreplay.co/post/how-to-make-ads-for-streetwear-brands-with-foreplay" target="_blank" rel="noopener noreferrer">Read the Foreplay streetwear source ↗</a></div><div><div class="eyebrow">Supplier connections still needed</div><h2>Next sourcing lanes.</h2>${leads.map((l) => `<div class="lead"><strong>${esc(l.provider)} / ${esc(l.name)}</strong><small>${esc(l.status.replaceAll("-", " "))}. ${esc(l.nextAction)}</small><br><a href="${esc(l.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open source ↗</a></div>`).join("")}</div></section></main>
<footer>Hustler Dior / Prepared September 14, 2026. Existing Printful commerce stays separate from these supplier drafts. No scarcity, exclusivity, designer affiliation, sales volume, or product authenticity is inferred from a public listing.</footer></div>
<dialog id="product-dialog" aria-labelledby="dialog-title"><div class="dialog-head"><span>PRODUCT REVIEW / DRAFT</span><button id="close-dialog" aria-label="Close product review">Close ×</button></div><div class="dialog-content" id="dialog-content"></div></dialog>
<script id="inventory-data" type="application/json">${JSON.stringify(models.map((row) => ({ ...row, preview: undefined }))).replaceAll("<", "\\u003c")}</script><script id="csv-data" type="application/json">${JSON.stringify(inventoryCsv).replaceAll("<", "\\u003c")}</script>
<script>
const rows=JSON.parse(document.getElementById('inventory-data').textContent);let group='new';
const cards=Array.from(document.querySelectorAll('[data-row]'));const dialog=document.getElementById('product-dialog');
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=c=>c==null?'Unconfirmed':'$'+(c/100).toFixed(2);
function filter(){const search=document.getElementById('search').value.toLowerCase();const audience=document.getElementById('audience').value;const category=document.getElementById('category').value;const priority=document.getElementById('priority').value;let count=0;cards.forEach((card,i)=>{const r=rows[i];const show=(group==='all'||group===r.group)&&(!audience||audience===r.audience)&&(!category||category===r.category)&&(!priority||priority===r.priority)&&[r.name,r.brand,r.supplier,r.material,r.collection].join(' ').toLowerCase().includes(search);card.hidden=!show;if(show)count++});document.getElementById('count').textContent=count+' products shown · All are drafts; stock and account costs remain unconfirmed.';document.getElementById('empty').hidden=count>0}
document.querySelectorAll('[data-group]').forEach(button=>button.addEventListener('click',()=>{group=button.dataset.group;document.querySelectorAll('[data-group]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));filter()}));
['search','audience','category','priority'].forEach(id=>document.getElementById(id).addEventListener('input',filter));
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>{const i=Number(button.dataset.open),r=rows[i],img=cards[i].querySelector('img'),p=r.priceObservation,s=r.scenario,t=r.stressScenario;const fact=(k,v)=>'<dt>'+escapeHtml(k)+'</dt><dd>'+escapeHtml(v)+'</dd>';document.getElementById('dialog-content').innerHTML='<div>'+(img?'<img src="'+img.src+'" alt="'+escapeHtml(img.alt)+'">':'<p>Product image still required.</p>')+'<p class="status">Research draft · Sale disabled · Stock unknown</p></div><div><h2 id="dialog-title">'+escapeHtml(r.name)+'</h2><p>'+escapeHtml(r.description)+'</p><dl class="facts">'+fact('Supplier',r.supplier)+fact('Record',r.candidateId)+fact('Material',r.material||'Not verified')+fact('Sizes observed',(r.observedSizes||[]).join(', ')||'Need full variant feed')+fact('Colors observed',(r.observedColors||[]).join(', ')||'Need color mapping')+fact('Fabric GSM','Not supplied; do not infer from package weight')+fact('Public item cost',money(p?.publicDropshipCents))+fact('Bulk wholesale cost',money(p?.bulkWholesaleCents))+fact('Supplier MSRP',money(p?.supplierMsrpCents))+fact('Selected destination',p?.selectedDestination||'Not confirmed')+fact('Shipping display',p?.displayedShippingCents==null?'Not quoted':money(p.displayedShippingCents)+' — public page only')+fact('Approved selling price','Not set')+(s?fact('Base scenario test price',money(s.testPriceCents))+fact('Higher-cost test price',money(t.testPriceCents))+fact('Assumed shipping',money(s.shippingCents)+' / '+money(t.shippingCents))+fact('Assumed duty allowance',money(s.dutyAllowanceCents)+' / '+money(t.dutyAllowanceCents))+fact('Base contribution before ads',money(s.contributionCents))+fact('Max CAC to retain 20% contribution',money(s.maxAcquisitionCostAt20PercentCents)):'')+'</dl><p><strong>Checks before launch</strong></p><ul>'+[...r.reviewIssues,...(r.notes||[])].map(n=>'<li>'+escapeHtml(n)+'</li>').join('')+'</ul><a class="source-button" href="'+escapeHtml(r.source.url)+'" target="_blank" rel="noopener noreferrer">Open supplier product ↗</a></div>';dialog.showModal()}));
document.getElementById('close-dialog').addEventListener('click',()=>dialog.close());
document.getElementById('export').addEventListener('click',()=>{const blob=new Blob([JSON.parse(document.getElementById('csv-data').textContent)],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='dropship-inventory.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
</script></body></html>`;
await writeFile(resolve(target, "Hustler-Dior-Dropship-Review.html"), html);
console.log(
  JSON.stringify({
    folder: target,
    newDrafts: rows.length,
    existingDrafts: existing.length,
    photos: reviewed.filter((r) => r.preview).length,
    published: 0,
  }),
);
