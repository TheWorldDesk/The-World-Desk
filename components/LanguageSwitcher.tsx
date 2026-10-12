"use client";

import { useEffect } from "react";

const supportedLanguages = new Set([
  "af", "sq", "am", "ar", "hy", "az", "eu", "be", "bn", "bs", "bg", "ca",
  "ceb", "zh-CN", "zh-TW", "co", "hr", "cs", "da", "nl", "en", "eo", "et",
  "fi", "fr", "fy", "gl", "ka", "de", "el", "gu", "ht", "ha", "haw", "he",
  "hi", "hmn", "hu", "is", "ig", "id", "ga", "it", "ja", "jv", "kn", "kk",
  "km", "rw", "ko", "ku", "ky", "lo", "la", "lv", "lt", "lb", "mk", "mg",
  "ms", "ml", "mt", "mi", "mr", "mn", "my", "ne", "no", "ny", "or", "ps",
  "fa", "pl", "pt", "pa", "ro", "ru", "sm", "gd", "sr", "st", "sn", "sd",
  "si", "sk", "sl", "so", "es", "su", "sw", "sv", "tl", "tg", "ta", "tt",
  "te", "th", "tr", "tk", "uk", "ur", "uz", "vi", "cy", "xh", "yi", "yo",
  "zu",
]);

function normalizeLanguage(language: string): string | null {
  const normalized = language.trim().toLowerCase();
  const base = normalized.split("-")[0];

  if (!base || base === "en") return null;
  if (base === "zh") {
    return normalized.includes("tw") || normalized.includes("hk") || normalized.includes("hant")
      ? "zh-TW"
      : "zh-CN";
  }

  return supportedLanguages.has(base) ? base : null;
}

export default function LanguageSwitcher() {
  useEffect(() => {
    // This is a best-effort browser translation fallback, not native localization.
    // Keep it away from editor routes, APIs and framework/static assets.
    if (window.location.hostname.includes("translate.google")) return;

    const { pathname, search } = window.location;
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api/") ||
      pathname.startsWith("/_next/") ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml" ||
      /\.(?:png|jpe?g|gif|svg|webp|ico|css|js|map|woff2?|ttf|xml)$/i.test(pathname)
    ) {
      return;
    }

    // Respect an explicit English preference for the current browser session.
    try {
      if (window.sessionStorage.getItem("twd-language-choice") === "en") return;
      if (window.sessionStorage.getItem("twd-auto-translation-started") === "1") return;
    } catch {
      // Storage may be disabled; language detection can still proceed.
    }

    const preferredLanguages =
      Array.isArray(navigator.languages) && navigator.languages.length
        ? navigator.languages
        : [navigator.language];

    let targetLanguage: string | null = null;
    for (const language of preferredLanguages) {
      targetLanguage = normalizeLanguage(language);
      if (targetLanguage) break;
    }
    if (!targetLanguage) return;

    try {
      window.sessionStorage.setItem("twd-auto-translation-started", "1");
    } catch {
      // The external translation redirect still works without storage.
    }

    const currentUrl = window.location.origin + pathname + search;
    const translateUrl =
      "https://translate.google.com/translate?sl=auto&tl=" +
      encodeURIComponent(targetLanguage) +
      "&u=" +
      encodeURIComponent(currentUrl);

    window.location.replace(translateUrl);
  }, []);

  return null;
}
