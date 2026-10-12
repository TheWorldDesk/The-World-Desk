import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale, localeFromAcceptLanguage, RTL_LOCALES } from "@/lib/i18n";

const LOCALE_COOKIE = "twd-locale";

function requestedLocale(request: NextRequest): string {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (saved && isLocale(saved)) return saved;
  return localeFromAcceptLanguage(request.headers.get("accept-language")) || DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // APIs keep their public URL, but receive the reader's locale for localized search/results.
  if (pathname.startsWith("/api/")) {
    const locale = requestedLocale(request);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-twd-locale", locale);
    requestHeaders.set("x-twd-direction", RTL_LOCALES.has(locale) ? "rtl" : "ltr");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/admin") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(?:png|jpe?g|gif|svg|webp|ico|css|js|map|woff2?|ttf|xml|txt)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/");
  const firstSegment = segments[1] || "";

  if (isLocale(firstSegment)) {
    const locale = firstSegment;
    const rest = "/" + segments.slice(2).join("/");
    const destination = request.nextUrl.clone();
    destination.pathname = rest === "/" ? "/" : rest.replace(/\/$/, "");
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-twd-locale", locale);
    requestHeaders.set("x-twd-direction", RTL_LOCALES.has(locale) ? "rtl" : "ltr");
    const response = NextResponse.rewrite(destination, { request: { headers: requestHeaders } });
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });
    return response;
  }

  const locale = requestedLocale(request);
  const destination = request.nextUrl.clone();
  destination.pathname = "/" + locale + (pathname === "/" ? "" : pathname);
  return NextResponse.redirect(destination, 307);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
