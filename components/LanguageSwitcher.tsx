"use client";

import { useState } from "react";

const languages = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "es", label: "Español (Spanish)" },
  { code: "fr", label: "Français (French)" },
  { code: "ar", label: "العربية (Arabic)" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "zh-CN", label: "中文 (Chinese)" },
  { code: "pt", label: "Português (Portuguese)" },
  { code: "ru", label: "Русский (Russian)" },
  { code: "ja", label: "日本語 (Japanese)" },
  { code: "de", label: "Deutsch (German)" },
  { code: "it", label: "Italiano (Italian)" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "tr", label: "Türkçe (Turkish)" },
];

export default function LanguageSwitcher() {
  const [language, setLanguage] = useState("en");

  function changeLanguage(code: string) {
    setLanguage(code);
    if (code === "en") {
      window.location.href = window.location.origin + window.location.pathname + window.location.search;
      return;
    }
    const currentUrl = window.location.href;
    window.location.href =
      "https://translate.google.com/translate?sl=auto&tl=" +
      encodeURIComponent(code) +
      "&u=" +
      encodeURIComponent(currentUrl);
  }

  return (
    <div className="language-bar" aria-label="Website language">
      <span aria-hidden="true">文</span>
      <label htmlFor="site-language">Language</label>
      <select
        id="site-language"
        value={language}
        onChange={(event) => changeLanguage(event.target.value)}
        aria-label="Choose website language"
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>{item.label}</option>
        ))}
      </select>
      <small>Translations are automated and may contain errors.</small>
    </div>
  );
}
