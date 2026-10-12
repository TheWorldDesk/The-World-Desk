"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const languages = [
  ["en", "English"], ["bn", "বাংলা"], ["ar", "العربية"], ["hi", "हिन्दी"],
  ["es", "Español"], ["fr", "Français"], ["zh-CN", "简体中文"], ["zh-TW", "繁體中文"],
  ["pt", "Português"], ["ru", "Русский"], ["ja", "日本語"], ["de", "Deutsch"],
  ["it", "Italiano"], ["id", "Bahasa Indonesia"], ["tr", "Türkçe"], ["ko", "한국어"],
  ["vi", "Tiếng Việt"], ["ur", "اردو"], ["sw", "Kiswahili"], ["fa", "فارسی"],
  ["th", "ไทย"], ["nl", "Nederlands"], ["pl", "Polski"], ["uk", "Українська"],
  ["ms", "Bahasa Melayu"], ["ta", "தமிழ்"], ["te", "తెలుగు"], ["ml", "മലയാളം"],
  ["mr", "मराठी"], ["gu", "ગુજરાતી"], ["pa", "ਪੰਜਾਬੀ"], ["ne", "नेपाली"],
] as const;

const localeSet = new Set<string>(languages.map(([code]) => code));

export default function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    const first = pathname.split("/")[1];
    if (localeSet.has(first)) setLocale(first);
    else {
      try {
        const saved = document.cookie.split("; ").find((part) => part.startsWith("twd-locale="))?.split("=")[1];
        setLocale(saved && localeSet.has(decodeURIComponent(saved)) ? decodeURIComponent(saved) : "en");
      } catch { setLocale("en"); }
    }
  }, [pathname]);

  function changeLanguage(nextLocale: string) {
    setLocale(nextLocale);
    const segments = pathname.split("/");
    if (localeSet.has(segments[1])) segments.splice(1, 1);
    const cleanPath = segments.join("/") || "/";
    const query = searchParams.toString();
    window.location.assign("/" + nextLocale + (cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath) + (query ? "?" + query : ""));
  }

  return (
    <div className="language-bar">
      <span aria-hidden="true">文</span>
      <label htmlFor="twd-language">Language</label>
      <select id="twd-language" value={locale} onChange={(event) => changeLanguage(event.target.value)} aria-label="Choose website language">
        {languages.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select>
      <small>Choose your reading language</small>
    </div>
  );
}
