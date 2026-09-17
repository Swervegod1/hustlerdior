export type PrintfulProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  category: string;
  mock?: boolean;
  variantCount?: number;
};

export type PrintfulCatalogResult = {
  products: PrintfulProduct[];
  source: "printful" | "mock";
  message?: string;
};
