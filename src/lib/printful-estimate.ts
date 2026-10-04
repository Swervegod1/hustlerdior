import { z } from "zod";

// Printful's estimate endpoint returns JSON numbers; other responses use
// decimal strings. Normalize either representation before converting to cents.
const cost = z
  .union([z.string(), z.number().finite()])
  .transform(String)
  .pipe(z.string().regex(/^\d+(\.\d{1,2})?$/))
  .transform((value) => {
    const [whole, fraction = ""] = value.split(".");
    return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  })
  .pipe(z.number().int().nonnegative().max(10_000_000));

export const printfulEstimateSchema = z.object({
  result: z.object({
    costs: z.object({
      currency: z.literal("USD"),
      shipping: cost,
      total: cost,
    }),
  }),
});
