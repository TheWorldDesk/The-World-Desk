import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { DEFAULT_LOCALE, RTL_LOCALES, isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: {
    default: "The World Desk | Independent Global News",
    template: "%s | The World Desk",
  },
  description:
    "Global news, politics, business, technology, science, climate and culture. Independent journalism and global perspectives.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://the-world-desk.vercel.app"),
  openGraph: {
    type: "website",
    siteName: "The World Desk",
    title: "The World Desk | Independent Global News",
    description: "Independent journalism. Global perspectives.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = headers();
  const requestedLocale = requestHeaders.get("x-twd-locale") || DEFAULT_LOCALE;
  const locale = isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
  const direction = RTL_LOCALES.has(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={direction}>
      <body>
        <LanguageSwitcher />
        {children}
      </body>
    </html>
  );
}
