/** Build from the same verified CMS/commerce record used to render the page. */
const stockStates = new Set(["InStock", "OutOfStock", "PreOrder", "BackOrder", "Discontinued"]);

function text(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

function https(value, field) {
  const url = new URL(text(value, field));
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(`${field} must be a public HTTPS URL`);
  }
  return url.href;
}

export function buildProductGraph({ store, product, faqs }) {
  const origin = new URL(https(store.url, "store.url")).origin;
  const url = https(product.canonicalUrl, "product.canonicalUrl");
  if (new URL(url).hash) throw new Error("Canonical URL must not contain a fragment");
  if (new URL(url).origin !== origin) throw new Error("Product must use the flagship canonical origin");
  if (!Number.isFinite(product.fabricGsm) || product.fabricGsm <= 0) throw new Error("Verified fabric GSM required");
  if (!Array.isArray(product.images) || !product.images.length) throw new Error("At least one real product image required");
  if (!Array.isArray(faqs) || !faqs.length) throw new Error("Visible product FAQs required");

  const merchantId = `${origin}/#merchant`;
  const brandId = `${origin}/#label`;
  const productId = `${url}#product`;
  const merchant = {
    "@type": "OnlineStore",
    "@id": merchantId,
    name: text(store.name, "store.name"),
    url: `${origin}/`,
    logo: https(store.logoUrl, "store.logoUrl"),
  };

  // ClothingStore is a local-business type. Include it only for a genuine,
  // publicly documented physical shop; online-only merchants keep OnlineStore.
  if (store.physicalShop) {
    const a = store.physicalShop;
    if (a.verified !== true) throw new Error("Physical shop must be verified");
    merchant["@type"] = ["OnlineStore", "ClothingStore"];
    merchant.address = {
      "@type": "PostalAddress",
      streetAddress: text(a.streetAddress, "streetAddress"),
      addressLocality: text(a.addressLocality, "addressLocality"),
      addressRegion: text(a.addressRegion, "addressRegion"),
      postalCode: text(a.postalCode, "postalCode"),
      addressCountry: text(a.addressCountry, "addressCountry"),
    };
  }

  const item = {
    "@type": "Product",
    "@id": productId,
    url,
    name: text(product.name, "product.name"),
    description: text(product.description, "product.description"),
    image: product.images.map((image) => https(image, "image")),
    sku: text(product.sku, "sku"),
    brand: product.isOwnLabel === true
      ? { "@id": brandId }
      : { "@type": "Brand", name: text(product.brandName, "Original product brand") },
    material: text(product.material, "material"),
    color: text(product.color, "color"),
    size: text(product.size, "size"),
    additionalProperty: [
      { "@type": "PropertyValue", name: "Fabric weight", value: product.fabricGsm, unitText: "g/m²" },
      { "@type": "PropertyValue", name: "Silhouette", value: text(product.silhouette, "silhouette") },
      { "@type": "PropertyValue", name: "Drape", value: text(product.drape, "drape") },
      { "@type": "PropertyValue", name: "Sizing recommendation", value: text(product.sizingRecommendation, "sizingRecommendation") },
    ],
  };

  const graph = [merchant, { "@type": "Brand", "@id": brandId, name: store.name }, item];
  // Closed previews must never advertise an active Offer.
  if (product.commerceOpen === true) {
    if (!Number.isSafeInteger(product.priceMinor) || product.priceMinor <= 0) throw new Error("Positive authoritative priceMinor required");
    // This storefront's rollout is USD-only. Extend using currency-aware minor
    // unit conversion before adding currencies with different decimal rules.
    if (product.currency !== "USD") throw new Error("This template requires USD");
    if (!stockStates.has(product.availability)) throw new Error("Invalid availability");
    const offerId = `${url}#offer`;
    item.offers = { "@id": offerId };
    graph.push({
      "@type": "Offer",
      "@id": offerId,
      url,
      priceCurrency: "USD",
      price: (product.priceMinor / 100).toFixed(2),
      availability: `https://schema.org/${product.availability}`,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": merchantId },
      itemOffered: { "@id": productId },
    });
  }

  graph.push({
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    url,
    about: { "@id": productId },
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: text(faq.question, "question"),
      acceptedAnswer: { "@type": "Answer", text: text(faq.answer, "answer") },
    })),
  });
  return { "@context": "https://schema.org", "@graph": graph };
}

export function serializeJsonLd(graph) {
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}

export const descriptionTemplate = "Meet {name}, a {gsm} GSM {fabric} tee with an oversized silhouette and {drape} drape. Choose your usual size for relaxed volume, or size down for a closer fit. Check garment measurements before ordering, then build your everyday rotation around it.";
