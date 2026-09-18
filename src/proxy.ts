import { NextResponse, type NextRequest } from "next/server";
import { isIndexable, CANONICAL_ORIGIN } from "@/lib/seo";

export function proxy(request: NextRequest) {
  // Standalone Next can normalize nextUrl to its internal listener. Host identifies the public request.
  const hostname = (request.headers.get("host") ?? request.nextUrl.host)
    .toLowerCase()
    .replace(/:\d+$/, "");
  if (
    hostname === "www.hustlerdior.com" &&
    process.env.SITE_ROLE === "primary"
  ) {
    const target = new URL(CANONICAL_ORIGIN);
    target.pathname = request.nextUrl.pathname;
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 308);
  }
  const response = NextResponse.next();
  if (!isIndexable() || hostname !== "hustlerdior.com") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg).*)"],
};
