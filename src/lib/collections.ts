import type { Product } from "./types";

type IndexProduct = Pick<
  Product,
  "id" | "name" | "slug" | "category" | "audience"
>;
export interface Collection {
  slug: string;
  name: string;
  title: string;
  description: string;
  intro: string;
  note: string;
  matches: (product: IndexProduct) => boolean;
  priority?: Product["audience"];
}

export const collections: Collection[] = [
  {
    slug: "tees",
    name: "Tees & tops",
    title: "Streetwear Tees & Tops",
    description:
      "Explore Hustler Dior tees and tops, from heavyweight graphic tees to long sleeves and cropped fits. Compare real color and size options.",
    intro:
      "Start with the piece that says something. Explore graphic tees, long sleeves and everyday tops from the Hustler Dior collection.",
    note: "An oversized tee and a fitted top create different silhouettes. Use the product name as a starting point, then compare the available size and color combinations on each piece.",
    matches: (p) => p.category === "Tees" && p.audience !== "Kids",
  },
  {
    slug: "hoodies-layers",
    name: "Hoodies & layers",
    title: "Streetwear Hoodies & Sweatshirts",
    description:
      "Explore Hustler Dior hoodies, sweatshirts and streetwear layers. Find cropped, oversized and everyday silhouettes with current variant pricing.",
    intro:
      "Build the outfit from the outside in. Hoodies and sweatshirts bring shape, texture and a different kind of presence to your daily rotation.",
    note: "For a balanced outfit, pair a roomy layer with a straighter bottom. If the layer is cropped, compare its hem position with the rise of the bottoms you already wear. Fit varies by garment.",
    matches: (p) => p.category === "Layers" && p.audience !== "Kids",
  },
  {
    slug: "womens-streetwear",
    name: "Women’s streetwear",
    title: "Women’s & Unisex Streetwear",
    description:
      "Explore women’s and unisex streetwear at Hustler Dior: cropped tops, hoodies, graphic tees and layers. Choose your own silhouette.",
    intro:
      "Cropped, fitted or oversized: build a silhouette on your terms. This edit brings women’s pieces together with unisex tees and layers.",
    note: "Unisex pieces are included so you can compare more silhouettes in one place. A size label is not a universal measurement; the same letter can fit differently across cropped and unisex styles.",
    matches: (p) =>
      ["Women", "Unisex"].includes(p.audience) &&
      ["Tees", "Layers", "Bottoms"].includes(p.category),
    priority: "Women",
  },
  {
    slug: "mens-streetwear",
    name: "Men’s streetwear",
    title: "Men’s & Unisex Streetwear",
    description:
      "Explore men’s and unisex streetwear at Hustler Dior, including graphic tees, heavyweight tops, hoodies and shorts. Find your next everyday piece.",
    intro:
      "Graphic tees, heavyweight layers and an everyday rotation with a point of view. Explore men’s pieces alongside unisex styles.",
    note: "Start with a tee you already like, then choose a layer that leaves room through the shoulders and sleeves. Product names distinguish fitted, regular and oversized styles where the catalog provides that detail.",
    matches: (p) =>
      ["Men", "Unisex"].includes(p.audience) &&
      ["Tees", "Layers", "Bottoms"].includes(p.category),
    priority: "Men",
  },
];

export function collectionProducts<T extends IndexProduct>(
  collection: Collection,
  products: T[],
): T[] {
  const filtered = products.filter(collection.matches);
  return collection.priority
    ? filtered.toSorted(
        (a, b) =>
          Number(b.audience === collection.priority) -
          Number(a.audience === collection.priority),
      )
    : filtered;
}

export const COLLECTION_PAGE_SIZE = 12;
