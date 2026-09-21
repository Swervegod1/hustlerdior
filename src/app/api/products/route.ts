import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProducts, PrintfulError } from "@/lib/server/printful";

export const runtime = "nodejs";
const query = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(12),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
});
export async function GET(request: NextRequest) {
  const input = query.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!input.success)
    return NextResponse.json(
      { error: "Invalid pagination. Use limit 1–100 and a nonnegative offset." },
      { status: 400 },
    );
  try {
    const result = await getProducts(input.data.limit, input.data.offset);
    // Cache upstream reads, not downstream JSON: signed webhooks invalidate the data tag immediately.
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "The collection is temporarily unavailable. Please try again." },
      {
        status:
          error instanceof PrintfulError && error.status === 429 ? 503 : 502,
        headers: { "Cache-Control": "no-store", "Retry-After": "30" },
      },
    );
  }
}
