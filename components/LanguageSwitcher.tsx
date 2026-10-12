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
  const base = language.trim().toLowerCase().split("-")[0];
  if (!base || base === "en") return null;
  if (base === "zh") {
    return language.toLowerCase().includes("tw") || language.toLowerCase().includes("hk")
      ? "zh-TW"
      : "zh-CN";
  }
  return supportedLanguages.has(base) ? base : null;
}

export default function LanguageSwitcher() {
  useEffect(() => {
    // Google Translate's translated-page proxy must never be redirected again.
    if (window.location.hostname.includes("translate.google")) return;

    // Respect a user's explicit choice for this browser session.
    try {
      if (window.sessionStorage.getItem("twd-language-choice") === "en") return;
      if (window.sessionStorage.getItem("twd-auto-translation-started") === "1") return;
    } catch {
      // Continue with browser-language detection if storage is unavailable.
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
      // The redirect still works when storage is unavailable.
    }

    const currentUrl = window.location.href;
    const translateUrl =
      "https://translate.google.com/translate?sl=auto&tl=" +
      encodeURIComponent(targetLanguage) +
      "&u=" +
      encodeURIComponent(currentUrl);
    window.location.replace(translateUrl);
  }, []);

  return null;
}
