import type { Metadata } from "next";
import "./globals.css";
import LanguageSwitcher from "@/components/LanguageSwitcher";
export const metadata: Metadata = {
 title: { default: "The World Desk | Independent Global News", template: "%s | The World Desk" },
 description: "Global news, politics, business, technology, science, climate and culture. Independent journalism and global perspectives.",
 metadataBase: new URL("https://the-world-desk.vercel.app"),
 openGraph: { type: "website", siteName: "The World Desk", title: "The World Desk | Independent Global News", description: "Independent journalism. Global perspectives." },
};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><LanguageSwitcher />{children}</body></html>; }