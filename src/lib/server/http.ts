import "server-only";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function readBody(request: Request, max = 32768) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Use application/json.");
  return readBytes(request, max);
}
export async function readBytes(request: Request, max: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Request body is required.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > max) {
        await reader.cancel();
        throw new HttpError(413, "Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
export function assertOrigin(request: Request) {
  const expected = new URL(process.env.SITE_URL || "http://localhost:3000")
    .origin;
  if (request.headers.get("origin") !== expected)
    throw new HttpError(403, "This request is not allowed.");
}
export const privateHeaders = { "Cache-Control": "no-store" };
