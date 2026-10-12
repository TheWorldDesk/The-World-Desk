import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://the-world-desk.vercel.app").replace(/\/$/, "");
  const urls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/en`, changeFrequency: "hourly", priority: 1 },
    { url: `${baseUrl}/en/latest`, changeFrequency: "hourly", priority: 0.8 },
  ];

  if (!supabase) return urls;
  const { data, error } = await supabase
    .from("articles")
    .select("slug,published_at,updated_at")
    .eq("status", "published")
    .eq("language", "en")
    .order("published_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("Unable to build article sitemap:", error.message);
    return urls;
  }

  for (const article of data ?? []) {
    urls.push({
      url: `${baseUrl}/en/article/${article.slug}`,
      lastModified: article.updated_at || article.published_at || new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  const { data: translations, error: translationsError } = await supabase
    .from("article_translations")
    .select("language_code, articles!inner(slug,updated_at,published_at,status)")
    .eq("translation_status", "published")
    .eq("articles.status", "published")
    .limit(5000);

  if (translationsError) {
    console.error("Unable to build translated article sitemap:", translationsError.message);
  } else {
    for (const row of translations ?? []) {
      const joined = row.articles as unknown as
        | { slug: string; updated_at: string | null; published_at: string | null; status: string }
        | { slug: string; updated_at: string | null; published_at: string | null; status: string }[]
        | null;
      const article = Array.isArray(joined) ? joined[0] : joined;
      if (!article || article.status !== "published") continue;
      urls.push({
        url: `${baseUrl}/${row.language_code}/article/${article.slug}`,
        lastModified: article.updated_at || article.published_at || new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }
  return urls;
}
