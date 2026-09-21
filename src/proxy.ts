import { NextResponse, type NextRequest } from "next/server";
import { guideSlugAction, unknownGuideHtml } from "@/lib/guide-route";
import {
  CANONICAL_ORIGIN,
  normalizeHost,
  publicHostFrom,
  xRobotsTag,
} from "@/lib/seo";

function publicOrigin(request: NextRequest, hostname: string) {
  const proto = (
    request.headers.get("x-forwarded-proto") ||
    request.nextUrl.protocol.replace(":", "") ||
    "https"
  )
    .split(",")[0]
    .trim();
  const candidates = [
    request.headers.get("x-forwarded-host"),
    request.headers.get("host"),
    request.nextUrl.host,
  ];
  const withPort =
    candidates
      .map((value) => value?.split(",")[0]?.trim() || "")
      .find((value) => value && normalizeHost(value) === hostname) || hostname;
  return `${proto}://${withPort}`;
}

export function proxy(request: NextRequest) {
  // Standalone Next can normalize nextUrl to its internal listener. Host identifies the public request.
  const hostname = publicHostFrom(request.headers);
  if (hostname === "www.hustlerdior.com") {
    const target = new URL(CANONICAL_ORIGIN);
    target.pathname = request.nextUrl.pathname;
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 308);
  }

  const guide = guideSlugAction(request.nextUrl.pathname);
  if (guide.kind === "redirect") {
    return NextResponse.redirect(
      new URL(
        guide.pathname,
        publicOrigin(request, hostname || request.nextUrl.host),
      ),
      301,
    );
  }
  if (guide.kind === "not-found") {
    // notFound() behind loading.tsx flushes HTTP 200 with the root (home) title.
    // End the request here so unknown guide slugs are a real 404.
    return new NextResponse(unknownGuideHtml(), {
      status: 404,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store",
      },
    });
  }

  const response = NextResponse.next();
  const robots = xRobotsTag(process.env, hostname, request.nextUrl.pathname);
  if (robots) response.headers.set("X-Robots-Tag", robots);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg).*)"],
};
