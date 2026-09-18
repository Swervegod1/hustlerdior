import { NextResponse } from "next/server";
import { getProduct, PrintfulError } from "@/lib/server/printful";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^\d{1,15}$/.test(id))
    return NextResponse.json({ error: "Invalid product." }, { status: 400 });
  try {
    const product = await getProduct(Number(id));
    return NextResponse.json(
      product ? { product } : { error: "Product not found." },
      { status: product ? 200 : 404, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Product unavailable." },
      {
        status:
          error instanceof PrintfulError && error.status === 404 ? 404 : 502,
      },
    );
  }
}
