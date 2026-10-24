import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search News",
  description: "Search The World Desk's published global news coverage.",
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
