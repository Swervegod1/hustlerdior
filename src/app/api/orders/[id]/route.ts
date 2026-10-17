import { z } from "zod";
import { browserOwner } from "@/lib/server/session";
import { loadOrder } from "@/lib/server/orders";
import { privateHeaders } from "@/lib/server/http";
import { apiError } from "@/lib/server/responses";
import { publicOrderMeasurement } from "@/lib/analytics";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = z.uuid().parse((await params).id);
    const order = await loadOrder(id, await browserOwner());
    return Response.json(
      publicOrderMeasurement(id, order.status, order.snapshot),
      { headers: privateHeaders },
    );
  } catch (error) {
    return apiError(error);
  }
}
