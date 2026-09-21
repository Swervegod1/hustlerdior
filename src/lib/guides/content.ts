export type GuideFaq = {
  q: string;
  a: string;
};

export type GuideSection = {
  heading: string;
  body: string;
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  sections: GuideSection[];
  faqs: GuideFaq[];
};

const GUIDES: Guide[] = [
  {
    slug: "tactical-luxury-streetwear-positioning",
    title: "Tactical luxury streetwear positioning",
    description:
      "How Hustler Dior sits between graphic streetwear and considered luxury — without boardroom polish.",
    sections: [
      {
        heading: "The Concrete Edit lane",
        body: "Tactical luxury is not a logo tax. It is weight, print, and scarcity: pieces that look like they survived a city, priced like they were made on purpose. The Concrete Edit uses made-to-order Printful fulfillment so the catalog can stay wide without dead stock.",
      },
      {
        heading: "What we refuse",
        body: "Seasonal filler, fake drops, and generic SaaS aesthetics. Positioning is the manifesto in product form — heavyweight blanks, distressed marks, and copy that sounds like the block, not a pitch deck.",
      },
    ],
    faqs: [
      {
        q: "Is Hustler Dior a luxury house?",
        a: "No. It is independent graphic streetwear with a tactical-luxury standard: better blanks, tighter graphics, no corporate calendar.",
      },
      {
        q: "Why made-to-order?",
        a: "Print-on-demand keeps inventory honest. You order, Printful prints, it ships. No warehouse of last season’s mistakes.",
      },
    ],
  },
  {
    slug: "veteran-owned-streetwear-brand-story",
    title: "Veteran-owned streetwear brand story",
    description:
      "The Hustler Dior origin: independent, veteran-owned, directed by Swerve God.",
    sections: [
      {
        heading: "Owned by the culture that built it",
        body: "Hustler Dior is veteran-owned independent streetwear. The story is not a campaign — it is the reason the brand does not outsource its voice. Creative direction stays with Swerve God.",
      },
      {
        heading: "Wear your own rules",
        body: "The line is a reminder, not a slogan farm. Graphic tees, hoodies, and accessories that read as field notes from the concrete, not moodboards from a trend report.",
      },
    ],
    faqs: [
      {
        q: "Who is behind the brand?",
        a: "Hustler Dior / The Concrete Edit is independently owned. Creative direction is by Swerve God.",
      },
      {
        q: "Where are pieces made?",
        a: "Each order is fulfilled made-to-order through Printful. Production starts when you pay.",
      },
    ],
  },
  {
    slug: "concrete-edit-90s-bootleg-graphic-tees",
    title: "Concrete Edit 90s bootleg graphic tees",
    description:
      "Bootleg energy, legal blanks: how the Concrete Edit treats 90s graphic language.",
    sections: [
      {
        heading: "Bootleg as attitude, not theft",
        body: "90s bootleg tees were loud, stacked, and slightly wrong on purpose. The Concrete Edit borrows that heat — distressed marks, oversized type, asphalt palettes — on licensed Printful blanks you can actually sell.",
      },
      {
        heading: "Graphics that hold under city light",
        body: "Prints are designed to read at a distance and still feel worn up close. No clip-art collage dumps. One mark, one idea, made to order.",
      },
    ],
    faqs: [
      {
        q: "Are these unofficial band or sports bootlegs?",
        a: "No. The Concrete Edit uses original marks. The bootleg reference is visual language, not counterfeit IP.",
      },
      {
        q: "What blanks do you use?",
        a: "Printful catalog garments selected for weight and print area. Exact blanks vary by drop.",
      },
    ],
  },
  {
    slug: "independent-streetwear-brands-2026",
    title: "Independent streetwear brands in 2026",
    description:
      "Why small catalogs, print-on-demand, and owned domains still beat marketplace noise.",
    sections: [
      {
        heading: "Independence is infrastructure",
        body: "In 2026 the advantage is not another Instagram theme. It is a domain you control, a checkout you can audit, and a catalog that is not rented from a mall algorithm. Hustler Dior runs on Next.js, Hostinger, Printful, and Stripe.",
      },
      {
        heading: "Full catalog, real payment",
        body: "A storefront that caps the closet at 100 pieces or cannot take a card is a brochure. Independent brands need the whole Printful store and a working Stripe Checkout session — not a coming-soon button.",
      },
    ],
    faqs: [
      {
        q: "Do you sell on marketplaces?",
        a: "The primary store is hustlerdior.com. Direct-to-consumer keeps the relationship and the margin.",
      },
      {
        q: "How often does the catalog change?",
        a: "The live Printful store is the source of truth. Ignored products stay hidden; everything else paginates in.",
      },
    ],
  },
  {
    slug: "made-to-order-dtc-buying-guide",
    title: "Made-to-order DTC buying guide",
    description:
      "What to expect when you buy Hustler Dior: sizing, shipping, and how checkout works.",
    sections: [
      {
        heading: "Order, print, ship",
        body: "Add a sized variant to your bag, pay through Stripe Checkout, and Printful produces the piece. There is no shelf inventory — production starts after payment. Shipping and tax are collected on Stripe’s hosted page.",
      },
      {
        heading: "If checkout is paused",
        body: "When Stripe keys are missing on the host, the bag still saves on your device and the UI says so. That is safer than a silent broken pay button. Ask the operator to set STRIPE_SECRET_KEY on the Hostinger Node.js app.",
      },
    ],
    faqs: [
      {
        q: "Can I edit an order after paying?",
        a: "Once Stripe Checkout completes, the order is final. Contact support with your Stripe receipt if something is wrong.",
      },
      {
        q: "Do you charge before printing?",
        a: "Yes. Made-to-order means payment first, then Printful fulfillment from the paid Stripe session.",
      },
    ],
  },
];

export class GuideCatalog {
  static all(): Guide[] {
    return GUIDES;
  }

  static slugs(): string[] {
    return GUIDES.map((guide) => guide.slug);
  }

  static bySlug(slug: string): Guide | undefined {
    return GUIDES.find((guide) => guide.slug === slug);
  }
}
