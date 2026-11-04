import { collections } from "./collections";

// Shared destinations keep the header directory and footer in sync.
export const directoryGroups = [
  {
    label: "Collections",
    links: collections.map(({ slug, name }) => ({
      href: `/collections/${slug}`,
      label: name,
    })),
  },
  {
    label: "About & guides",
    links: [
      { href: "/guides", label: "Guides" },
      { href: "/about", label: "About Hustler Dior" },
      { href: "/world", label: "The creative world" },
      { href: "/fit-guide", label: "Fit guide" },
    ],
  },
  {
    label: "Help & policies",
    links: [
      { href: "/help", label: "Ordering information" },
      { href: "/shipping", label: "Shipping details" },
      { href: "/returns", label: "Returns & damaged items" },
      { href: "/terms", label: "Sale terms" },
      { href: "/contact", label: "Contact the store" },
      { href: "/privacy", label: "Photo & shopping privacy" },
    ],
  },
];
