import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale, localeFromAcceptLanguage, RTL_LOCALES, type Locale } from "@/lib/i18n";

const LOCALE_COOKIE = "twd-locale";

function localeFromSearchText(text: string): string | null {
  const query = text.trim();
  if (!query) return null;
  if (/[\u0980-\u09FF]/u.test(query)) return "bn";
  if (/[\u0B80-\u0BFF]/u.test(query)) return "ta";
  if (/[\u0C00-\u0C7F]/u.test(query)) return "te";
  if (/[\u0D00-\u0D7F]/u.test(query)) return "ml";
  if (/[\u0A80-\u0AFF]/u.test(query)) return "gu";
  if (/[\u0A00-\u0A7F]/u.test(query)) return "pa";
  if (/[\u0900-\u097F]/u.test(query)) return "hi";
  if (/[\u0E00-\u0E7F]/u.test(query)) return "th";
  if (/[\uAC00-\uD7AF]/u.test(query)) return "ko";
  if (/[\u3040-\u30FF]/u.test(query)) return "ja";
  if (/[\u4E00-\u9FFF]/u.test(query)) return "zh-CN";
  if (/[\u0600-\u06FF]/u.test(query)) {
    if (/[پچژگ]/u.test(query)) return "fa";
    if (/[ٹڈڑںھۓے]/u.test(query)) return "ur";
    return "ar";
  }
  if (/[\u0400-\u04FF]/u.test(query)) return /[іїєґ]/iu.test(query) ? "uk" : "ru";
  if (/[\u0370-\u03FF]/u.test(query)) return null;
  // An unaccented Latin-script query is treated as English; otherwise use browser preferences.
  if (/^[\x00-\x7F\s\p{P}\p{N}]+$/u.test(query)) return "en";
  return null;
}

function requestedLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const queryLocale = localeFromSearchText(request.nextUrl.searchParams.get("q") || "");
  if (queryLocale && isLocale(queryLocale)) return queryLocale;
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
    if (destination.pathname === "/admin" || destination.pathname.startsWith("/admin/")) {
      return NextResponse.rewrite(destination);
    }
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
