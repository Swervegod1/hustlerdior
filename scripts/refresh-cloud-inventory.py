"""Render a reviewed public catalog snapshot; never create variants or prices."""
import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlencode

source, target = map(Path, sys.argv[1:3])
products = []
offset = 0
while True:
    page = json.loads((source / f"catalog-page-{offset}.json").read_text())
    assert page["source"] == "printful"
    assert page["paging"]["offset"] == offset
    products.extend(page["products"])
    offset = page["paging"]["nextOffset"]
    if offset is None:
        break
assert len(products) == page["paging"]["total"]
assert len({p["id"] for p in products}) == len(products)
e = html.escape
cards, entries = [], []
for n, p in enumerate(products, 1):
    assert p["variants"] and p["image"].startswith("https://files.cdn.printful.com/")
    assert re.fullmatch(r"[a-z0-9-]+", p["slug"])
    canonical = "https://hustlerdior.com/products/" + p["slug"]
    url = canonical + "?" + urlencode(dict(utm_source="cloud_landing", utm_medium="referral", utm_campaign="concrete_edit"))
    image = "https://hustlerdior.com/_next/image?" + urlencode(dict(url=p["image"], w=640, q=75))
    name = e(p["name"])
    cards.append(f'<article class="card" data-name="{e(p["name"].lower())}"><a class="photo" href="{e(url)}" aria-label="View {name}"><span class="number" aria-hidden="true">HD / {n:02}</span><img src="{e(image)}" alt="{name}" loading="lazy" decoding="async" width="640" height="800"><span class="arrow" aria-hidden="true">↗</span></a><h3><a href="{e(url)}">{name}</a></h3><div class="detail">Current price &amp; sizes on HustlerDior.com</div><a class="buy" href="{e(url)}">VIEW PIECE ↗</a></article>')
    entries.append({"id": p["id"], "name": p["name"], "url": canonical, "image": p["image"], "category": p["category"], "audience": p["audience"], "variantCount": len(p["variants"]), "sizes": list(dict.fromkeys(v["size"] for v in p["variants"])), "colors": list(dict.fromkeys(v["color"] for v in p["variants"]))})
original = (target / "rollback/index.html").read_text()
updated, n = re.subn(r'<div class="grid">.*?</div><p id="empty"', '<div class="grid">' + ''.join(cards) + '</div><div class="actions"><button type="button" class="btn outline" id="load-more" hidden>SHOW MORE PIECES</button></div><p id="empty"', original, count=1, flags=re.S)
assert n == 1
updated = updated.replace('role="status">9 pieces', f'role="status">{len(products)} pieces')
updated = updated.replace('src="app.js"', 'src="inventory-20261105.js"')
updated = updated.replace('</head>', '<style>#load-more[hidden]{display:none}</style></head>')
updated = updated.replace('This is a selection from Hustler Dior.', 'This catalog was refreshed from Hustler Dior on November 5, 2026; new additions and availability may change.')
schema = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "Hustler Dior — The Cloud Edit", "url": "https://hustlerdior.cloud/", "mainEntity": {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i, "name": p["name"], "url": p["url"]} for i, p in enumerate(entries, 1)]}}
updated, n = re.subn(r'<script type="application/ld\+json">.*?</script>', '<script type="application/ld+json">' + json.dumps(schema, ensure_ascii=False).replace('<', '\\u003c') + '</script>', updated, count=1, flags=re.S)
assert n == 1
(target / "index.html").write_text(updated)
(target / "inventory-catalog-20261105.json").write_text(json.dumps({"source": "https://hustlerdior.com/api/products", "capturedAt": "2026-11-05", "total": len(entries), "variantCount": sum(len(p["variants"]) for p in products), "products": entries}, ensure_ascii=False, indent=2))
print(json.dumps({"products": len(entries), "variants": sum(len(p["variants"]) for p in products), "bytes": len(updated.encode())}))
