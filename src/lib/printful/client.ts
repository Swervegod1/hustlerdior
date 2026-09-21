import { dollarsToCents } from "@/src/lib/checkout/parse";
import { formatMoney } from "@/src/lib/money";
import {
  PRINTFUL_PAGE_LIMIT,
  reachedCatalogEnd,
} from "@/src/lib/printful/paging";
import type {
  CheckoutLineInput,
  PrintfulCatalogResult,
  PrintfulProduct,
  PrintfulVariant,
  ResolvedCheckoutLine,
} from "./types";

const DEFAULT_STORE_ID = "18749826";

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

type SyncVariant = {
  id?: number | string;
  name?: string;
  retail_price?: string | number;
  currency?: string;
  size?: string;
  color?: string;
  is_ignored?: boolean;
  availability_status?: string;
  product?: { image?: string };
  files?: Array<{ type?: string; preview_url?: string; thumbnail_url?: string }>;
};

type StoreProductDetailResponse = {
  result?: {
    sync_product?: {
      id?: number | string;
      name?: string;
      thumbnail_url?: string;
      external_id?: string;
    };
    sync_variants?: SyncVariant[];
  };
};

export class PrintfulCheckoutError extends Error {
  readonly status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.name = "PrintfulCheckoutError";
    this.status = status;
  }
}

/**
 * Printful API client — static class methods only.
 * Falls back to mock Concrete Edit drops when env is missing or the API fails.
 * Default store: 18749826 (Hustler Dior Hostinger catalog).
 */
export class PrintfulClient {
  private static readonly BASE_URL = "https://api.printful.com";

  private static getApiKey(): string | undefined {
    return (
      process.env.PRINTFUL_API_KEY?.trim() ||
      process.env.PRINTFUL_API_TOKEN?.trim() ||
      undefined
    );
  }

  private static getStoreId(): string {
    return process.env.PRINTFUL_STORE_ID?.trim() || DEFAULT_STORE_ID;
  }

  /** Configured when an API key is present; store ID has a documented default. */
  static isConfigured(): boolean {
    return Boolean(PrintfulClient.getApiKey());
  }

  private static authHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${PrintfulClient.getApiKey()}`,
      "X-PF-Store-Id": PrintfulClient.getStoreId(),
      "Content-Type": "application/json",
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
        variantCount: 2,
        variants: [
          {
            id: "mock-concrete-tee-m",
            name: "Black / M",
            color: "Black",
            size: "M",
            price: 48,
            currency: "USD",
            imageUrl: null,
            inStock: true,
          },
          {
            id: "mock-concrete-tee-l",
            name: "Black / L",
            color: "Black",
            size: "L",
            price: 48,
            currency: "USD",
            imageUrl: null,
            inStock: true,
          },
        ],
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
        variantCount: 2,
        variants: [
          {
            id: "mock-swerve-hoodie-m",
            name: "Asphalt / M",
            color: "Asphalt",
            size: "M",
            price: 78,
            currency: "USD",
            imageUrl: null,
            inStock: true,
          },
          {
            id: "mock-swerve-hoodie-l",
            name: "Asphalt / L",
            color: "Asphalt",
            size: "L",
            price: 78,
            currency: "USD",
            imageUrl: null,
            inStock: true,
          },
        ],
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
        variantCount: 1,
        variants: [
          {
            id: "mock-night-shift-cap-os",
            name: "Black / One size",
            color: "Black",
            size: "One size",
            price: 36,
            currency: "USD",
            imageUrl: null,
            inStock: true,
          },
        ],
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
        variantCount: 2,
        variants: [
          {
            id: "mock-asphalt-longsleeve-m",
            name: "Asphalt / M",
            color: "Asphalt",
            size: "M",
            price: 58,
            currency: "USD",
            imageUrl: null,
            inStock: true,
          },
          {
            id: "mock-asphalt-longsleeve-l",
            name: "Asphalt / L",
            color: "Asphalt",
            size: "L",
            price: 58,
            currency: "USD",
            imageUrl: null,
            inStock: true,
          },
        ],
      },
    ];
  }

  private static parsePrice(raw: string | number | undefined): number {
    if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
    if (raw == null) return 0;
    const parsed = Number.parseFloat(String(raw));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private static variantImage(variant: SyncVariant, fallback: string | null): string | null {
    const preview = variant.files?.find((file) => file.preview_url || file.thumbnail_url);
    return (
      preview?.preview_url ||
      preview?.thumbnail_url ||
      variant.product?.image ||
      fallback ||
      null
    );
  }

  private static mapVariant(
    variant: SyncVariant,
    fallbackImage: string | null,
  ): PrintfulVariant | null {
    if (variant.id == null || variant.is_ignored) return null;
    const price = PrintfulClient.parsePrice(variant.retail_price);
    if (price <= 0) return null;
    const availability = (variant.availability_status ?? "").toLowerCase();
    const inStock = availability !== "discontinued" && availability !== "unavailable";
    return {
      id: String(variant.id),
      name: variant.name ?? `Variant ${String(variant.id)}`,
      size: variant.size || undefined,
      color: variant.color || undefined,
      price,
      currency: variant.currency || "USD",
      imageUrl: PrintfulClient.variantImage(variant, fallbackImage),
      inStock,
    };
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

    const fallbackImage = sync.thumbnail_url ?? null;
    const variants = (result.sync_variants ?? [])
      .map((variant) => PrintfulClient.mapVariant(variant, fallbackImage))
      .filter((variant): variant is PrintfulVariant => variant !== null);

    let minPrice = 0;
    let currency = "USD";
    for (const variant of variants) {
      if (minPrice === 0 || variant.price < minPrice) {
        minPrice = variant.price;
        currency = variant.currency;
      }
    }

    return {
      id: String(sync.id),
      name: sync.name ?? `Drop ${String(sync.id)}`,
      description: "Made-to-order via Printful. The Concrete Edit.",
      price: minPrice,
      currency,
      imageUrl: fallbackImage,
      category: "Store",
      variantCount: variants.length || undefined,
      variants,
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
      let ignoredCount = 0;

      while (true) {
        const response = await fetch(
          `${PrintfulClient.BASE_URL}/store/products?limit=${PRINTFUL_PAGE_LIMIT}&offset=${offset}`,
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
          if (item.is_ignored) {
            ignoredCount += 1;
            continue;
          }
          products.push(PrintfulClient.mapListItem(item));
        }

        const nextOffset = offset + page.length;
        if (reachedCatalogEnd({ pageLength: page.length, nextOffset, total })) {
          break;
        }
        offset = nextOffset;
      }

      if (products.length === 0) {
        return {
          products: PrintfulClient.getMockProducts(),
          source: "mock",
          message: "Printful store returned no products — using mock catalog.",
          storeTotal: total,
          ignoredCount,
        };
      }

      const ignoredNote =
        ignoredCount > 0 ? ` · ${ignoredCount} ignored hidden` : "";
      return {
        products,
        source: "printful",
        message: `Live Printful · ${products.length} drops${ignoredNote}`,
        storeTotal: total,
        ignoredCount,
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
    if (PrintfulClient.isConfigured() && !id.startsWith("mock-")) {
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

  /**
   * Re-price bag lines from Printful. Never trusts client-supplied prices.
   */
  static async resolveCheckoutLines(
    items: CheckoutLineInput[],
  ): Promise<ResolvedCheckoutLine[]> {
    if (!PrintfulClient.isConfigured()) {
      throw new PrintfulCheckoutError(
        "Printful is not configured. Set PRINTFUL_API_KEY before taking payment.",
        503,
      );
    }

    const lines: ResolvedCheckoutLine[] = [];
    const currency = "USD";

    for (const item of items) {
      if (item.productId.startsWith("mock-") || item.variantId.startsWith("mock-")) {
        throw new PrintfulCheckoutError(
          "Mock drops cannot be purchased. Connect Printful to sell live inventory.",
        );
      }

      const product = await PrintfulClient.fetchProduct(item.productId);
      if (!product || product.mock) {
        throw new PrintfulCheckoutError(
          "A piece in your bag is no longer in the store. Remove it and try again.",
        );
      }

      const variant = product.variants?.find((entry) => entry.id === item.variantId);
      if (!variant || !variant.inStock || variant.price <= 0) {
        throw new PrintfulCheckoutError(
          `${product.name} needs a priced, in-stock size before checkout.`,
        );
      }

      const unitAmountCents = dollarsToCents(variant.price);
      if (unitAmountCents < 50) {
        throw new PrintfulCheckoutError(
          `${product.name} is priced below Stripe’s minimum charge. Update the Printful retail price.`,
        );
      }

      const lineCurrency = (variant.currency || product.currency || "USD").toUpperCase();
      if (lineCurrency !== currency) {
        throw new PrintfulCheckoutError(
          "Bag mixes currencies. Checkout one currency at a time.",
        );
      }

      const label = [product.name, variant.color, variant.size]
        .filter(Boolean)
        .join(" · ");

      lines.push({
        productId: product.id,
        variantId: variant.id,
        name: label,
        quantity: item.quantity,
        unitAmountCents,
        currency: lineCurrency.toLowerCase(),
        imageUrl: variant.imageUrl || product.imageUrl,
      });
    }

    return lines;
  }

  static async createOrder(input: {
    recipient: {
      name: string;
      email?: string;
      phone?: string;
      address1: string;
      address2?: string;
      city: string;
      state_code?: string;
      country_code: string;
      zip: string;
    };
    items: Array<{ sync_variant_id: number; quantity: number }>;
    stripeSessionId: string;
  }): Promise<{ id?: number | string } | null> {
    if (!PrintfulClient.isConfigured()) return null;

    const response = await fetch(`${PrintfulClient.BASE_URL}/orders`, {
      method: "POST",
      headers: PrintfulClient.authHeaders(),
      body: JSON.stringify({
        recipient: input.recipient,
        items: input.items,
        external_id: input.stripeSessionId.slice(0, 32),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Printful order failed (${response.status}): ${detail.slice(0, 300)}`);
    }

    const payload = (await response.json()) as { result?: { id?: number | string } };
    return payload.result ?? null;
  }

  static async estimateShipping(
    recipient: {
      name: string;
      address1: string;
      address2?: string;
      city: string;
      state_code?: string;
      country_code: string;
      zip: string;
    },
    items: Array<{ sync_variant_id: number; quantity: number }>,
  ): Promise<number | null> {
    if (!PrintfulClient.isConfigured()) return null;
    const response = await fetch(`${PrintfulClient.BASE_URL}/orders/estimate-costs`, {
      method: "POST",
      headers: PrintfulClient.authHeaders(),
      body: JSON.stringify({
        recipient,
        shipping: "STANDARD",
        items,
        retail_costs: { currency: "USD" },
      }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      result?: { costs?: { shipping?: string | number } };
    };
    const raw = payload.result?.costs?.shipping;
    const dollars = PrintfulClient.parsePrice(raw);
    if (dollars <= 0) return 0;
    return dollarsToCents(dollars);
  }

  static formatPrice(product: PrintfulProduct): string {
    if (!product.price) {
      return "From collection";
    }
    return formatMoney(product.price, product.currency || "USD");
  }

  static formatMoney(amount: number, currency = "USD"): string {
    return formatMoney(amount, currency);
  }
}
