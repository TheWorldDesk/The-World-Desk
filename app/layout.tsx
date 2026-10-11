import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
 title: { default: "The World Desk | Independent Global News", template: "%s | The World Desk" },
 description: "World news, Bangladesh, politics, business, technology, science and culture. Independent journalism and global perspectives.",
 metadataBase: new URL("https://the-world-desk.vercel.app"),
 openGraph: { type: "website", siteName: "The World Desk", title: "The World Desk | Independent Global News", description: "Independent journalism. Global perspectives." },
};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }