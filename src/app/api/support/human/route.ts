import {
  assertOrigin,
  privateHeaders,
  readBody,
  HttpError,
} from "@/lib/server/http";
import { browserOwner } from "@/lib/server/session";
import { apiError } from "@/lib/server/responses";
import { requestHuman, supportConfigured } from "@/lib/server/support";

export const runtime = "nodejs";
export async function GET() {
  try {
    const ready = supportConfigured();
    if (ready) await browserOwner(true);
    return Response.json({ ready }, { headers: privateHeaders });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    if (!supportConfigured())
      throw new HttpError(
        503,
        "Human alerts are not connected yet. Please email hustlerdior@gmail.com.",
      );
    const input = JSON.parse((await readBody(request, 4096)).toString("utf8"));
    const result = await requestHuman(input, await browserOwner());
    return Response.json(result, { headers: privateHeaders });
  } catch (error) {
    return apiError(error);
  }
}
