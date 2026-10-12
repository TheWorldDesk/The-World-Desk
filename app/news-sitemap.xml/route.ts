import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 900;

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://the-world-desk.vercel.app").replace(/\/$/, "");

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

type NewsEntry = { slug: string; title: string; language: string; publishedAt: string };

export async function GET() {
  if (!supabase) {
    return new NextResponse("News sitemap temporarily unavailable", { status: 503 });
  }

  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const entries: NewsEntry[] = [];
  const { data: articles, error } = await supabase
    .from("articles")
    .select("slug,title,published_at")
    .eq("status", "published")
    .eq("language", "en")
    .gte("published_at", cutoff)
    .order("published_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Unable to generate English news sitemap:", error.message);
    return new NextResponse("News sitemap temporarily unavailable", { status: 503 });
  }

  for (const article of articles ?? []) {
    if (article.published_at) entries.push({ slug: article.slug, title: article.title, language: "en", publishedAt: article.published_at });
  }

  const { data: translations, error: translationsError } = await supabase
    .from("article_translations")
    .select("language_code,title,articles!inner(slug,published_at,status)")
    .eq("translation_status", "published")
    .eq("articles.status", "published")
    .gte("articles.published_at", cutoff)
    .order("updated_at", { ascending: false })
    .limit(1000);

  if (translationsError) {
    console.error("Unable to generate translated news sitemap entries:", translationsError.message);
  } else {
    for (const row of translations ?? []) {
      const joined = row.articles as unknown as
        | { slug: string; published_at: string | null; status: string }
        | { slug: string; published_at: string | null; status: string }[]
        | null;
      const article = Array.isArray(joined) ? joined[0] : joined;
      if (!article || article.status !== "published" || !article.published_at) continue;
      entries.push({ slug: article.slug, title: row.title, language: row.language_code, publishedAt: article.published_at });
    }
  }

  const urls = entries.map((entry) => `  <url>
    <loc>${xmlEscape(`${baseUrl}/${entry.language}/article/${entry.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>The World Desk</news:name>
        <news:language>${xmlEscape(entry.language)}</news:language>
      </news:publication>
      <news:publication_date>${new Date(entry.publishedAt).toISOString()}</news:publication_date>
      <news:title>${xmlEscape(entry.title)}</news:title>
    </news:news>
  </url>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
