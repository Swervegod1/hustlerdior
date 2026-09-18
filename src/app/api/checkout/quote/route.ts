import { assertOrigin, privateHeaders, readBody } from "@/lib/server/http";
import { browserOwner } from "@/lib/server/session";
import { quoteOrder } from "@/lib/server/orders";
import { apiError } from "@/lib/server/responses";
export const runtime = "nodejs";
export const maxDuration = 180;
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const input = JSON.parse((await readBody(request)).toString("utf8"));
    return Response.json(await quoteOrder(input, await browserOwner(true)), {
      headers: privateHeaders,
    });
  } catch (error) {
    return apiError(error);
  }
}
