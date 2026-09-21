export type PrintfulVariant = {
  id: string;
  name: string;
  size?: string;
  color?: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  inStock: boolean;
};

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
  variants?: PrintfulVariant[];
};

export type PrintfulCatalogResult = {
  products: PrintfulProduct[];
  source: "printful" | "mock";
  message?: string;
  /** Printful paging.total when the live API reported one. */
  storeTotal?: number;
  ignoredCount?: number;
};

export type CheckoutLineInput = {
  productId: string;
  variantId: string;
  quantity: number;
};

export type ResolvedCheckoutLine = {
  productId: string;
  variantId: string;
  name: string;
  quantity: number;
  unitAmountCents: number;
  currency: string;
  imageUrl: string | null;
};
