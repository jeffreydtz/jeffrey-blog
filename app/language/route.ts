import { NextRequest, NextResponse } from "next/server";
import {
  isLocale,
  isPublicPath,
  localeCookie,
  localizedPath,
  negotiateLocale,
  stripLocale,
} from "@/lib/i18n/routing";

/** Non-sensitive preference, works with ordinary links and JavaScript disabled. */
export function GET(request: NextRequest) {
  const preference = request.nextUrl.searchParams.get("locale");
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  const path =
    isPublicPath(stripLocale(next)) &&
    !next.startsWith("//") &&
    !next.includes("\\")
      ? next
      : "/";
  const locale = isLocale(preference)
    ? preference
    : negotiateLocale(request.headers.get("accept-language"));
  const destination = new URL(localizedPath(path, locale), request.url);
  const response = NextResponse.redirect(destination, 303);
  response.headers.set("Cache-Control", "private, no-store");
  response.cookies.set(localeCookie, isLocale(preference) ? preference : "", {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    maxAge: isLocale(preference) ? 31536000 : 0,
  });
  return response;
}
