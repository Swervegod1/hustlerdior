import Stripe from "stripe";

const SECRET_PATTERN = /^[rs]k_(test|live)_/;

export function getStripeSecretKey(): string | undefined {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key || undefined;
}

export function isCheckoutEnabled(): boolean {
  if (process.env.CHECKOUT_ENABLED === "false") return false;
  const key = getStripeSecretKey();
  return Boolean(key && SECRET_PATTERN.test(key));
}

export function checkoutStatus(): {
  configured: boolean;
  publishableKeySet: boolean;
  message: string;
} {
  const publishableKeySet = Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim(),
  );
  const enabledFlag = process.env.CHECKOUT_ENABLED !== "false";
  const secret = getStripeSecretKey();
  const secretLooksValid = Boolean(secret && SECRET_PATTERN.test(secret));

  if (!enabledFlag) {
    return {
      configured: false,
      publishableKeySet,
      message:
        "Checkout is paused (CHECKOUT_ENABLED=false). Your bag stays on this device.",
    };
  }
  if (!secretLooksValid) {
    return {
      configured: false,
      publishableKeySet,
      message:
        "Stripe is not configured. Set STRIPE_SECRET_KEY on the Hostinger Node.js app to accept payment.",
    };
  }
  return {
    configured: true,
    publishableKeySet,
    message: publishableKeySet
      ? "Stripe Checkout is ready."
      : "Stripe Checkout is ready. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is optional for hosted Checkout.",
  };
}

export function stripeClient(): Stripe {
  const apiKey = getStripeSecretKey();
  if (!apiKey || !SECRET_PATTERN.test(apiKey)) {
    throw new Error("STRIPE_SECRET_KEY is missing or not a Stripe secret key.");
  }
  return new Stripe(apiKey);
}

export function siteOrigin(request?: Request): string {
  const fromEnv =
    process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      // Fall through to request origin.
    }
  }
  const headerOrigin = request?.headers.get("origin");
  if (headerOrigin) {
    try {
      return new URL(headerOrigin).origin;
    } catch {
      // Ignore invalid Origin.
    }
  }
  const host = request?.headers.get("x-forwarded-host") || request?.headers.get("host");
  const proto = request?.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host.split(",")[0]!.trim()}`;
  return "http://localhost:3000";
}

export function checkoutAllowedCountries(): string[] {
  const raw = process.env.CHECKOUT_ALLOWED_COUNTRIES?.trim();
  if (!raw) return ["US"];
  const codes = raw
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter((code) => /^[A-Z]{2}$/.test(code));
  return codes.length ? codes : ["US"];
}

export function shippingAmountCents(): number | null {
  const raw = process.env.STRIPE_SHIPPING_CENTS?.trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > 100_000) return null;
  return value;
}
