export type StockStatus =
  "available" | "out_of_stock" | "discontinued" | "unknown";
export type Category = "Tees" | "Layers" | "Bottoms" | "Accessories" | "Other";

export interface ProductVariant {
  id: number;
  catalogVariantId: number;
  name: string;
  size: string;
  color: string;
  priceCents: number;
  currency: string;
  image: string | null;
  stock: StockStatus;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  category: Category;
  audience: "Unisex" | "Women" | "Men" | "Kids";
  variants: ProductVariant[];
  priceCents: number;
  maxPriceCents: number;
  currency: string;
}

export interface CatalogPage {
  products: Product[];
  paging: {
    total: number;
    limit: number;
    offset: number;
    nextOffset: number | null;
  };
  source: "printful" | "snapshot";
  fetchedAt: string;
}

export interface CartLine {
  productId: number;
  variantId: number;
  name: string;
  color: string;
  size: string;
  image: string | null;
  priceCents: number;
  currency: string;
  quantity: number;
}
