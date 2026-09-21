import { checkoutQuoteSchema } from "@/lib/commerce-schema";
import { assertOrigin, privateHeaders, readBody } from "@/lib/server/http";
import { browserOwner } from "@/lib/server/session";
import { createCheckout } from "@/lib/server/orders";
import { apiError } from "@/lib/server/responses";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const { quoteId } = checkoutQuoteSchema.parse(
      JSON.parse((await readBody(request)).toString("utf8")),
    );
    return Response.json(await createCheckout(quoteId, await browserOwner()), {
      headers: privateHeaders,
    });
  } catch (error) {
    return apiError(error);
  }
}
