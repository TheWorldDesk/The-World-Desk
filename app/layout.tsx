import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { DEFAULT_LOCALE, RTL_LOCALES, isLocale } from "@/lib/i18n";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://the-world-desk.vercel.app").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "The World Desk | Independent Global News",
    template: "%s | The World Desk",
  },
  description:
    "Global news, politics, business, technology, science, climate and culture. Independent journalism and global perspectives.",
  applicationName: "The World Desk",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "The World Desk",
    url: siteUrl,
    title: "The World Desk | Independent Global News",
    description: "Independent journalism. Global perspectives.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The World Desk | Independent Global News",
    description: "Independent journalism. Global perspectives.",
  },
};

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = headers();
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
        {children}
      </body>
    </html>
  );
}
