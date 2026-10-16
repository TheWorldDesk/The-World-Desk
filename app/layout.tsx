import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./public-theme.css";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PageViewTracker from "@/components/PageViewTracker";
import { DEFAULT_LOCALE, RTL_LOCALES, isLocale } from "@/lib/i18n";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://the-world-desk.vercel.app").replace(/\/$/, "");
const englishOnlyPaths = new Set(["/about", "/contact", "/editorial-standards", "/corrections", "/privacy", "/terms"]);

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const requestedLocale = requestHeaders.get("x-twd-locale") || DEFAULT_LOCALE;
  const locale = isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
  const requestedPath = requestHeaders.get("x-twd-pathname") || `/${locale}`;
  const segments = requestedPath.split("/").filter(Boolean);
  const cleanSegments = segments.length && isLocale(segments[0]) ? segments.slice(1) : segments;
  const cleanPath = cleanSegments.length ? `/${cleanSegments.join("/")}` : "/";
  const englishOnly = englishOnlyPaths.has(cleanPath);
  const canonicalPath = englishOnly ? `/en${cleanPath}` : `/${locale}${cleanPath === "/" ? "" : cleanPath}`;
  const languages: Record<string, string> = {};
  if (cleanPath === "/" || cleanPath === "/latest" || cleanPath.startsWith("/section/")) {
    languages.en = `${siteUrl}/en${cleanPath === "/" ? "" : cleanPath}`;
    languages["x-default"] = languages.en;
    languages.bn = `${siteUrl}/bn${cleanPath === "/" ? "" : cleanPath}`;
  }

  const isBangla = locale === "bn" && !englishOnly;
  const title = isBangla ? "The World Desk | বাংলা ও আন্তর্জাতিক সংবাদ" : "The World Desk | Independent Global News";
  const description = isBangla
    ? "বাংলাদেশ ও বিশ্বের সর্বশেষ খবর, রাজনীতি, ব্যবসা, প্রযুক্তি, বিজ্ঞান, জলবায়ু ও সংস্কৃতি।"
    : "Global news, politics, business, technology, science, climate and culture. Independent journalism and global perspectives.";

  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: "%s | The World Desk" },
    description,
    applicationName: "The World Desk",
    alternates: {
      canonical: canonicalPath,
      ...(Object.keys(languages).length ? { languages } : {}),
    },
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      shortcut: "/icon.svg",
    },
    openGraph: {
      type: "website",
      siteName: "The World Desk",
      url: `${siteUrl}${canonicalPath}`,
      title,
      description,
      locale: isBangla ? "bn_BD" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "The World Desk",
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "The World Desk",
      url: siteUrl,
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: ["en", "bn"],
    },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const requestedLocale = requestHeaders.get("x-twd-locale") || DEFAULT_LOCALE;
  const locale = isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
  const direction = RTL_LOCALES.has(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={direction}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }}
        />
        <LanguageSwitcher />
        <PageViewTracker />
        {children}
      </body>
    </html>
  );
}
