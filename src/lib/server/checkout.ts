import "server-only";
import { checkoutSchema, type CheckoutInput } from "../checkout-schema";
import { getProduct, getLiveAvailability } from "./printful";
import { HttpError } from "./http";

export async function buildVerifiedCart(input: CheckoutInput) {
  const { items } = checkoutSchema.parse(input);
  const products = new Map();
  // Bounded sequential reads: keep long carts within the upstream rate limit.
  for (const id of new Set(items.map((i) => i.productId)))
    products.set(id, await getProduct(id, true));
  const lines = [];
  for (const item of items) {
    const product = products.get(item.productId) as Awaited<
      ReturnType<typeof getProduct>
    >;
    const variant = product?.variants.find((v) => v.id === item.variantId);
    if (!product || !variant || variant.stock !== "available")
      throw new HttpError(
        409,
        "A selected size is no longer available. Update your bag.",
      );
    if (!(await getLiveAvailability(variant.catalogVariantId)))
      throw new HttpError(
        409,
        "A selected piece cannot currently be fulfilled. Update your bag.",
      );
    lines.push({
      ...item,
      priceCents: variant.priceCents,
      currency: variant.currency,
      name: product.name,
    });
  }
  const currency = lines[0].currency;
  if (lines.some((l) => l.currency !== currency))
    throw new HttpError(409, "All items must use the same currency.");
  return {
    lines,
    currency,
    subtotalCents: lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0),
  };
}

export type VerifiedCart = Awaited<ReturnType<typeof buildVerifiedCart>>;
