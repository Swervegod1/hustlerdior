import type { PrintfulCatalogResult, PrintfulProduct } from "./types";

/**
 * Printful API client — static class methods only.
 * Falls back to mock Concrete Edit drops when env is missing or the API fails.
 */
export class PrintfulClient {
  private static readonly BASE_URL = "https://api.printful.com";

  private static getApiKey(): string | undefined {
    return process.env.PRINTFUL_API_KEY?.trim() || undefined;
  }

  private static getStoreId(): string | undefined {
    return process.env.PRINTFUL_STORE_ID?.trim() || undefined;
  }

  private static isConfigured(): boolean {
    return Boolean(PrintfulClient.getApiKey() && PrintfulClient.getStoreId());
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

  static async fetchCatalog(): Promise<PrintfulCatalogResult> {
    if (!PrintfulClient.isConfigured()) {
      return {
        products: PrintfulClient.getMockProducts(),
        source: "mock",
        message:
          "PRINTFUL_API_KEY / PRINTFUL_STORE_ID not set — showing Concrete Edit mock drops.",
      };
    }

    try {
      const storeId = PrintfulClient.getStoreId()!;
      const response = await fetch(
        `${PrintfulClient.BASE_URL}/store/products?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${PrintfulClient.getApiKey()}`,
            "X-PF-Store-Id": storeId,
          },
          next: { revalidate: 300 },
        },
      );

      if (!response.ok) {
        throw new Error(`Printful HTTP ${response.status}`);
      }

      const payload = (await response.json()) as {
        result?: Array<{
          id: number | string;
          name?: string;
          thumbnail_url?: string;
          sync_product?: { name?: string; thumbnail_url?: string };
        }>;
      };

      const products: PrintfulProduct[] = (payload.result ?? []).map((item) => {
        const name =
          item.sync_product?.name ?? item.name ?? `Drop ${String(item.id)}`;
        return {
          id: String(item.id),
          name,
          description: "Made-to-order via Printful. The Concrete Edit.",
          price: 0,
          currency: "USD",
          imageUrl: item.sync_product?.thumbnail_url ?? item.thumbnail_url ?? null,
          category: "Store",
        };
      });

      if (products.length === 0) {
        return {
          products: PrintfulClient.getMockProducts(),
          source: "mock",
          message: "Printful store returned no products — using mock catalog.",
        };
      }

      return { products, source: "printful" };
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
