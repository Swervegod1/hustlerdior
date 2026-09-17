import type { PrintfulCatalogResult, PrintfulProduct } from "./types";

const DEFAULT_STORE_ID = "18749826";
const PAGE_LIMIT = 100;
const MAX_PRODUCTS = 300;

type StoreProductListItem = {
  id: number | string;
  external_id?: string;
  name?: string;
  variants?: number;
  synced?: number;
  thumbnail_url?: string;
  is_ignored?: boolean;
};

type StoreProductListResponse = {
  result?: StoreProductListItem[];
  paging?: { total?: number; limit?: number; offset?: number };
};

type StoreProductDetailResponse = {
  result?: {
    sync_product?: {
      id?: number | string;
      name?: string;
      thumbnail_url?: string;
      external_id?: string;
    };
    sync_variants?: Array<{
      retail_price?: string | number;
      currency?: string;
      name?: string;
    }>;
  };
};

/**
 * Printful API client — static class methods only.
 * Falls back to mock Concrete Edit drops when env is missing or the API fails.
 * Default store: 18749826 (Hustler Dior Hostinger website builder).
 */
export class PrintfulClient {
  private static readonly BASE_URL = "https://api.printful.com";

  private static getApiKey(): string | undefined {
    return process.env.PRINTFUL_API_KEY?.trim() || undefined;
  }

  private static getStoreId(): string {
    return process.env.PRINTFUL_STORE_ID?.trim() || DEFAULT_STORE_ID;
  }

  /** Configured when an API key is present; store ID has a documented default. */
  private static isConfigured(): boolean {
    return Boolean(PrintfulClient.getApiKey());
  }

  private static authHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${PrintfulClient.getApiKey()}`,
      "X-PF-Store-Id": PrintfulClient.getStoreId(),
    };
  }

  static getMockProducts(): PrintfulProduct[] {
    return [
      {
        id: "mock-concrete-tee",
        name: "Concrete Edit Tee",
        description:
          "Heavyweight blank with distressed Concrete Edit mark. Made-to-order graphic streetwear.",
        price: 48,
        currency: "USD",
        imageUrl: null,
        category: "Tees",
        mock: true,
      },
      {
        id: "mock-swerve-hoodie",
        name: "Swerve God Hoodie",
        description:
          "Oversized fleece with raw-edge print. Wear your own rules.",
        price: 78,
        currency: "USD",
        imageUrl: null,
        category: "Hoodies",
        mock: true,
      },
      {
        id: "mock-night-shift-cap",
        name: "Night Shift Cap",
        description: "Structured six-panel with tonal embroidery.",
        price: 36,
        currency: "USD",
        imageUrl: null,
        category: "Accessories",
        mock: true,
      },
      {
        id: "mock-asphalt-longsleeve",
        name: "Asphalt Longsleeve",
        description: "Garment-dyed long sleeve. Soft hand, hard message.",
        price: 58,
        currency: "USD",
        imageUrl: null,
        category: "Tees",
        mock: true,
      },
    ];
  }

  private static mapListItem(item: StoreProductListItem): PrintfulProduct {
    return {
      id: String(item.id),
      name: item.name ?? `Drop ${String(item.id)}`,
      description: "Made-to-order via Printful. The Concrete Edit.",
      price: 0,
      currency: "USD",
      imageUrl: item.thumbnail_url ?? null,
      category: "Store",
      variantCount:
        typeof item.variants === "number" ? item.variants : undefined,
    };
  }

  private static mapDetail(
    result: NonNullable<StoreProductDetailResponse["result"]>,
  ): PrintfulProduct | null {
    const sync = result.sync_product;
    if (!sync?.id && sync?.id !== 0) {
      return null;
    }

    const variants = result.sync_variants ?? [];
    let minPrice = 0;
    let currency = "USD";

    for (const variant of variants) {
      const raw = variant.retail_price;
      const parsed =
        typeof raw === "number" ? raw : raw != null ? Number.parseFloat(String(raw)) : NaN;
      if (!Number.isFinite(parsed) || parsed <= 0) continue;
      if (minPrice === 0 || parsed < minPrice) {
        minPrice = parsed;
        if (variant.currency) currency = variant.currency;
      }
    }

    return {
      id: String(sync.id),
      name: sync.name ?? `Drop ${String(sync.id)}`,
      description: "Made-to-order via Printful. The Concrete Edit.",
      price: minPrice,
      currency,
      imageUrl: sync.thumbnail_url ?? null,
      category: "Store",
      variantCount: variants.length || undefined,
    };
  }

  static async fetchCatalog(): Promise<PrintfulCatalogResult> {
    if (!PrintfulClient.isConfigured()) {
      return {
        products: PrintfulClient.getMockProducts(),
        source: "mock",
        message:
          "PRINTFUL_API_KEY not set — showing Concrete Edit mock drops. Store defaults to 18749826 when live.",
      };
    }

    try {
      const products: PrintfulProduct[] = [];
      let offset = 0;
      let total: number | undefined;

      while (products.length < MAX_PRODUCTS) {
        const response = await fetch(
          `${PrintfulClient.BASE_URL}/store/products?limit=${PAGE_LIMIT}&offset=${offset}`,
          {
            headers: PrintfulClient.authHeaders(),
            next: { revalidate: 300 },
          },
        );

        if (!response.ok) {
          throw new Error(`Printful HTTP ${response.status}`);
        }

        const payload = (await response.json()) as StoreProductListResponse;
        const page = payload.result ?? [];
        total = payload.paging?.total ?? total;

        for (const item of page) {
          if (item.is_ignored) continue;
          products.push(PrintfulClient.mapListItem(item));
          if (products.length >= MAX_PRODUCTS) break;
        }

        offset += PAGE_LIMIT;
        const reachedEnd =
          page.length === 0 ||
          page.length < PAGE_LIMIT ||
          (typeof total === "number" && offset >= total);

        if (reachedEnd || products.length >= MAX_PRODUCTS) break;
      }

      if (products.length === 0) {
        return {
          products: PrintfulClient.getMockProducts(),
          source: "mock",
          message: "Printful store returned no products — using mock catalog.",
        };
      }

      return {
        products,
        source: "printful",
        message: `Live Printful · ${products.length} drops`,
      };
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Unknown Printful error";
      return {
        products: PrintfulClient.getMockProducts(),
        source: "mock",
        message: `Printful unavailable (${reason}) — using mock catalog.`,
      };
    }
  }

  static async fetchProduct(id: string): Promise<PrintfulProduct | null> {
    if (PrintfulClient.isConfigured()) {
      try {
        const response = await fetch(
          `${PrintfulClient.BASE_URL}/store/products/${encodeURIComponent(id)}`,
          {
            headers: PrintfulClient.authHeaders(),
            next: { revalidate: 300 },
          },
        );

        if (response.ok) {
          const payload = (await response.json()) as StoreProductDetailResponse;
          if (payload.result) {
            const mapped = PrintfulClient.mapDetail(payload.result);
            if (mapped) return mapped;
          }
        }
      } catch {
        // Fall through to catalog lookup.
      }
    }

    const catalog = await PrintfulClient.fetchCatalog();
    return catalog.products.find((product) => product.id === id) ?? null;
  }

  static formatPrice(product: PrintfulProduct): string {
    if (!product.price) {
      return "Price on request";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: product.currency || "USD",
    }).format(product.price);
  }
}
