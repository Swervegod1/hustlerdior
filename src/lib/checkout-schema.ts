import { z } from "zod";
export const checkoutSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            productId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
            variantId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
            quantity: z.number().int().min(1).max(20),
          })
          .strict(),
      )
      .min(1)
      .max(30),
  })
  .strict()
  .superRefine((cart, ctx) => {
    if (new Set(cart.items.map((i) => i.variantId)).size !== cart.items.length)
      ctx.addIssue({
        code: "custom",
        message: "Duplicate variants are not allowed.",
      });
    if (cart.items.reduce((n, l) => n + l.quantity, 0) > 100)
      ctx.addIssue({
        code: "custom",
        message: "Order quantity exceeds the limit.",
      });
  });
export const recipientSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.email().max(254),
    address1: z.string().trim().min(3).max(200),
    address2: z.string().trim().max(200).optional(),
    city: z.string().trim().min(1).max(100),
    state_code: z
      .string()
      .trim()
      .toUpperCase()
      .refine(
        (value) =>
          "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY"
            .split(" ")
            .includes(value),
        "Use a supported US state code.",
      ),
    country_code: z.literal("US"),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  })
  .strict();
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type Recipient = z.infer<typeof recipientSchema>;
