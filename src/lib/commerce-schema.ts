import { z } from "zod";
import { checkoutSchema, recipientSchema } from "./checkout-schema";
export const quoteRequestSchema = z
  .object({ cart: checkoutSchema, recipient: recipientSchema })
  .strict();
export const checkoutQuoteSchema = z.object({ quoteId: z.uuid() }).strict();
const cents = z.number().int().nonnegative().max(10_000_000);
export const orderSnapshotSchema = z.object({
  cart: checkoutSchema,
  recipient: recipientSchema,
  lines: z
    .array(
      z.object({
        productId: z.number().int(),
        variantId: z.number().int(),
        quantity: z.number().int().positive(),
        priceCents: cents,
        currency: z.literal("USD"),
        name: z.string(),
      }),
    )
    .min(1)
    .max(30),
  currency: z.literal("USD"),
  subtotalCents: cents,
  shippingCents: cents,
  fulfillmentCostCents: cents,
  quoteExpires: z.number().int(),
  stripeExpires: z.number().int(),
  taxMode: z.enum(["automatic", "test_none"]),
  livemode: z.boolean(),
});
export type OrderSnapshot = z.infer<typeof orderSnapshotSchema>;
export interface PublicQuote {
  id: string;
  subtotalCents: number;
  shippingCents: number;
  currency: string;
  expiresAt: number;
  lines: {
    name: string;
    quantity: number;
    priceCents: number;
    variantId: number;
  }[];
}
