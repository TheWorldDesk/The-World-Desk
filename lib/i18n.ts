export const SUPPORTED_LOCALES = [
  "en", "bn", "ar", "hi", "es", "fr", "zh-CN", "zh-TW", "pt", "ru", "ja",
  "de", "it", "id", "tr", "ko", "vi", "ur", "sw", "fa", "th", "tl",
  "nl", "pl", "uk", "ms", "ta", "te", "ml", "mr", "gu", "pa", "ne",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const RTL_LOCALES = new Set<Locale>(["ar", "fa", "ur"]);

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const candidates = header
    .split(",")
    .map((entry) => {
      const [tag, quality] = entry.trim().split(/;\s*q=/i);
      return { tag: tag.toLowerCase(), quality: quality ? Number(quality) : 1 };
    })
    .filter((entry) => Number.isFinite(entry.quality) && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const candidate of candidates) {
    const exact = SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === candidate.tag);
    if (exact) return exact;
    const base = candidate.tag.split("-")[0];
    if (base === "zh") {
      return candidate.tag.includes("tw") || candidate.tag.includes("hk") || candidate.tag.includes("hant")
        ? "zh-TW"
        : "zh-CN";
    }
    const match = SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === base);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English", bn: "বাংলা", ar: "العربية", hi: "हिन्दी", es: "Español",
  fr: "Français", "zh-CN": "简体中文", "zh-TW": "繁體中文", pt: "Português", ru: "Русский",
  ja: "日本語", de: "Deutsch", it: "Italiano", id: "Bahasa Indonesia",
  tr: "Türkçe", ko: "한국어", vi: "Tiếng Việt", ur: "اردو", sw: "Kiswahili",
  fa: "فارسی", th: "ไทย", tl: "Filipino", nl: "Nederlands", pl: "Polski", uk: "Українська",
  ms: "Bahasa Melayu", ta: "தமிழ்", te: "తెలుగు", ml: "മലയാളം", mr: "मराठी", gu: "ગુજરાતી",
  pa: "ਪੰਜਾਬੀ", ne: "नेपाली",
};
