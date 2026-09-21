import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { verifyPrintfulSignature } from "@/lib/webhook-signature";
import { CATALOG_TAG } from "@/lib/server/printful";
import { HttpError, privateHeaders, readBody } from "@/lib/server/http";

export const runtime = "nodejs";
const eventSchema = z.object({
  type: z.string(),
  occurred_at: z.iso.datetime({ offset: true }),
  retries: z.number().int().nonnegative(),
  store_id: z.number().int(),
  data: z.unknown(),
});
export async function POST(request: Request) {
  try {
    const secret = process.env.PRINTFUL_WEBHOOK_SECRET_HEX;
    const publicKey = process.env.PRINTFUL_WEBHOOK_PUBLIC_KEY;
    if (!secret || !publicKey)
      throw new HttpError(503, "Webhook is not configured.");
    const body = await readBody(request, 262144);
    if (
      !verifyPrintfulSignature(
        body,
        request.headers.get("x-pf-webhook-signature"),
        request.headers.get("x-pf-webhook-public-key"),
        publicKey,
        secret,
      )
    )
      throw new HttpError(401, "Invalid signature.");
    const event = eventSchema.safeParse(JSON.parse(body.toString("utf8")));
    if (
      !event.success ||
      event.data.store_id !== Number(process.env.PRINTFUL_STORE_ID)
    )
      throw new HttpError(400, "Invalid event.");
    // The only effect is idempotent cache invalidation. Retries can arrive after many hours.
    // Do not reject by a short timestamp window; do not log customer payloads.
    if (
      ["catalog_stock_updated", "catalog_price_changed"].includes(
        event.data.type,
      )
    )
      revalidateTag(CATALOG_TAG, { expire: 0 });
    return NextResponse.json({ received: true }, { headers: privateHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof HttpError ? error.message : "Invalid event." },
      {
        status: error instanceof HttpError ? error.status : 400,
        headers: privateHeaders,
      },
    );
  }
}
