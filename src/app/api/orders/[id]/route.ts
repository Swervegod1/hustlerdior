import { z } from "zod";
import { browserOwner } from "@/lib/server/session";
import { loadOrder } from "@/lib/server/orders";
import { privateHeaders } from "@/lib/server/http";
import { apiError } from "@/lib/server/responses";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = z.uuid().parse((await params).id);
    const order = await loadOrder(id, await browserOwner());
    return Response.json(
      {
        id,
        status: order.status,
        subtotalCents: order.snapshot.subtotalCents,
        shippingCents: order.snapshot.shippingCents,
        currency: order.snapshot.currency,
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    return apiError(error);
  }
}
