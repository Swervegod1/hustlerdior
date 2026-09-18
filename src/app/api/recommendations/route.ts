import { z } from "zod";
import { productIndex, productsForPage } from "@/lib/server/catalog";
import { apiError } from "@/lib/server/responses";
import { addOnVariants, recommendationCandidates } from "@/lib/merchandising";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const value = params.get("products") ?? "";
    const currency = z
      .string()
      .regex(/^[A-Z]{3}$/)
      .parse(params.get("currency") ?? "USD");
    const ids = z
      .array(z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER))
      .min(1)
      .max(30)
      .parse(value.split(","));
    const index = await productIndex();
    const products = await productsForPage(
      recommendationCandidates(index, ids),
    );
    return Response.json(
      {
        products: products
          .filter((p) => addOnVariants(p, currency).length > 0)
          .slice(0, 3),
      },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
