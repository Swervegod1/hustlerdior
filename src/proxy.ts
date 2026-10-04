import { NextResponse, type NextRequest } from "next/server";
import {
  collectionPathAction,
  orderPathAction,
} from "@/lib/collection-route";
import {
  guideSlugAction,
  unavailablePageHtml,
  unknownGuideHtml,
} from "@/lib/guide-route";
import {
  CANONICAL_ORIGIN,
  isProductionHost,
  normalizeHost,
  publicHostFrom,
  xRobotsTag,
} from "@/lib/seo";

function publicOrigin(request: NextRequest, hostname: string) {
  const forwarded = (
    request.headers.get("x-forwarded-proto") ||
    request.nextUrl.protocol.replace(":", "") ||
    "https"
  )
    .split(",")[0]
    .trim();
  // TLS is terminated in front of the Node process, which often sees plain HTTP.
  const proto = isProductionHost(hostname) ? "https" : forwarded;
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

  const origin = publicOrigin(request, hostname || request.nextUrl.host);
  const guide = guideSlugAction(request.nextUrl.pathname);
  if (guide.kind === "redirect") {
    return NextResponse.redirect(new URL(guide.pathname, origin), 301);
  }
  if (guide.kind === "not-found") {
    // Unknown guide slugs end here so they never render the homepage shell.
    return new NextResponse(unknownGuideHtml(), {
      status: 404,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store",
      },
    });
  }

  const collection = collectionPathAction(request.nextUrl.pathname);
  if (collection.kind === "redirect") {
    const target = new URL(collection.pathname, origin);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 301);
  }
  if (
    collection.kind === "not-found" ||
    orderPathAction(request.nextUrl.pathname).kind === "not-found"
  ) {
    const link =
      collection.kind === "not-found"
        ? { href: "/collections/tees", label: "Tees & tops" }
        : { href: "/", label: "Home" };
    return new NextResponse(unavailablePageHtml(link), {
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
