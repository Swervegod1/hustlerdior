import { PrintfulClient } from "@/src/lib/printful/client";
import { isCheckoutEnabled } from "@/src/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      ok: true,
      printful: PrintfulClient.isConfigured(),
      stripe: isCheckoutEnabled(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
