"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "@/lib/i18n";

const languages = SUPPORTED_LOCALES.map((code) => [code, LOCALE_LABELS[code]] as const);

const localeSet = new Set<string>(languages.map(([code]) => code));

export default function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState("en");
  const isBangla = locale === "bn";

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
      <label htmlFor="twd-language">{isBangla ? "ভাষা" : "Language"}</label>
      <select id="twd-language" value={locale} onChange={(event) => changeLanguage(event.target.value)} aria-label={isBangla ? "ওয়েবসাইটের ভাষা বেছে নিন" : "Choose website language"}>
        {languages.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select>
      <small>{isBangla ? "আপনার পছন্দের ভাষা বেছে নিন" : "Choose your reading language"}</small>
    </div>
  );
}
