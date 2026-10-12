import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 900;

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://the-world-desk.vercel.app").replace(/\/$/, "");

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  if (!supabase) {
    return new NextResponse("News sitemap temporarily unavailable", { status: 503 });
  }

  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("articles")
    .select("slug,title,published_at")
    .eq("status", "published")
    .eq("language", "en")
    .gte("published_at", cutoff)
    .order("published_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Unable to generate news sitemap:", error.message);
    return new NextResponse("News sitemap temporarily unavailable", { status: 503 });
  }

  const entries = (data ?? []).filter((article) => article.published_at).map((article) => `  <url>
    <loc>${xmlEscape(`${baseUrl}/en/article/${article.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>The World Desk</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(article.published_at as string).toISOString()}</news:publication_date>
      <news:title>${xmlEscape(article.title)}</news:title>
    </news:news>
  </url>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
