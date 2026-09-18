import { z } from "zod";
import {
  assertOrigin,
  HttpError,
  privateHeaders,
  readBytes,
} from "@/lib/server/http";
import { apiError } from "@/lib/server/responses";
import { browserOwner } from "@/lib/server/session";
import { consumeUsage } from "@/lib/server/database";
import {
  generateTryOn,
  sanitizePhoto,
  tryOnConfigured,
  MAX_PHOTO_BYTES,
} from "@/lib/server/try-on";
export const runtime = "nodejs";
export const maxDuration = 180;
const selection = z.object({
  productId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  variantId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  consent: z.literal("yes"),
});
export async function GET() {
  try {
    const ready = tryOnConfigured();
    if (ready) await browserOwner(true);
    return Response.json(
      { ready, maxBytes: MAX_PHOTO_BYTES },
      { headers: privateHeaders },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    if (!tryOnConfigured())
      throw new HttpError(
        503,
        "The fitting room is being prepared. Please check back soon.",
      );
    const owner = await browserOwner();
    await consumeUsage([
      {
        bucket: "tryon:requests",
        window: new Date().toISOString().slice(0, 13),
        limit: 120,
      },
      {
        bucket: `tryon:requests:${owner}`,
        window: new Date().toISOString().slice(0, 13),
        limit: 8,
      },
    ]);
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("multipart/form-data;"))
      throw new HttpError(415, "Upload a photo using the fitting room.");
    const bytes = await readBytes(request, MAX_PHOTO_BYTES + 65536);
    let data: FormData;
    try {
      data = await new Response(new Uint8Array(bytes), {
        headers: { "Content-Type": contentType },
      }).formData();
    } catch {
      throw new HttpError(400, "Invalid photo upload.");
    }
    const expected = new Set(["productId", "variantId", "consent", "photo"]);
    for (const key of data.keys())
      if (!expected.has(key) || data.getAll(key).length !== 1)
        throw new HttpError(400, "Invalid photo upload.");
    const selected = selection.parse(
      Object.fromEntries(
        [...data.entries()].filter(([key]) => key !== "photo"),
      ),
    );
    const photo = data.get("photo");
    if (!(photo instanceof File))
      throw new HttpError(400, "Choose a photo first.");
    const clean = await sanitizePhoto(
      Buffer.from(await photo.arrayBuffer()),
      photo.type,
    );
    const result = await generateTryOn(
      selected.productId,
      selected.variantId,
      clean,
      owner,
    );
    return new Response(new Uint8Array(result), {
      headers: {
        ...privateHeaders,
        "Content-Type": "image/jpeg",
        "Content-Disposition": 'inline; filename="hustlerdior-ai-preview.jpg"',
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
