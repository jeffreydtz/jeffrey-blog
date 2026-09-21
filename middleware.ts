import { NextResponse, type NextRequest } from "next/server";
import {
  isLocale,
  isPublicPath,
  localeCookie,
  localizedPath,
  negotiateLocale,
  stripLocale,
} from "@/lib/i18n/routing";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const candidate = pathname.split("/")[1];
  const locale = isLocale(candidate) ? candidate : undefined;
  const bare = locale ? stripLocale(pathname) : pathname;
  const headers = new Headers(request.headers);
  // Never trust a client-supplied locale/path, including requests to excluded routes.
  headers.delete("x-blog-locale");
  headers.delete("x-blog-path");
  const socialImage =
    bare === "/opengraph-image" ||
    /^\/posts\/[^/.]+\/opengraph-image$/.test(bare);
  if (
    locale &&
    (isPublicPath(bare) ||
      socialImage ||
      (!/^\/(admin|api|_next|feeds|lab)(\/|$)/.test(bare) &&
        !bare.includes(".")))
  ) {
    headers.set("x-blog-locale", locale);
    headers.set("x-blog-path", pathname + request.nextUrl.search);
    const url = request.nextUrl.clone();
    url.pathname = bare;
    const response = NextResponse.rewrite(url, { request: { headers } });
    response.headers.set("Content-Language", locale);
    return response;
  }
  if (!locale && isPublicPath(pathname)) {
    const chosen = negotiateLocale(
      request.headers.get("accept-language"),
      request.cookies.get(localeCookie)?.value,
    );
    const url = request.nextUrl.clone();
    url.pathname = localizedPath(pathname, chosen);
    const response = NextResponse.redirect(url, 307);
    response.headers.set("Vary", "Accept-Language, Cookie");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  return NextResponse.next({ request: { headers } });
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
