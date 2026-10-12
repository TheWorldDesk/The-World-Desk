import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://the-world-desk.vercel.app").replace(/\/$/, "");
  const homeAlternates = { en: `${baseUrl}/en`, bn: `${baseUrl}/bn`, "x-default": `${baseUrl}/en` };
  const latestAlternates = { en: `${baseUrl}/en/latest`, bn: `${baseUrl}/bn/latest`, "x-default": `${baseUrl}/en/latest` };
  const sections = ["world", "africa", "asia", "europe", "middle-east", "north-america", "latin-america", "earth", "politics", "business", "technology", "science", "climate", "health", "sports", "culture", "environment", "education", "travel", "agriculture"];
  const staticPages = ["about", "contact", "editorial-standards", "corrections", "privacy", "terms"];
  const urls: MetadataRoute.Sitemap = [
    { url: homeAlternates.en, changeFrequency: "hourly", priority: 1, alternates: { languages: homeAlternates } },
    { url: homeAlternates.bn, changeFrequency: "hourly", priority: 1, alternates: { languages: homeAlternates } },
    { url: latestAlternates.en, changeFrequency: "hourly", priority: 0.8, alternates: { languages: latestAlternates } },
    { url: latestAlternates.bn, changeFrequency: "hourly", priority: 0.8, alternates: { languages: latestAlternates } },
  ];

  for (const section of sections) {
    const languages = { en: `${baseUrl}/en/section/${section}`, bn: `${baseUrl}/bn/section/${section}`, "x-default": `${baseUrl}/en/section/${section}` };
    urls.push({ url: languages.en, changeFrequency: "daily", priority: 0.6, alternates: { languages } });
    urls.push({ url: languages.bn, changeFrequency: "daily", priority: 0.6, alternates: { languages } });
  }
  for (const page of staticPages) {
    // These policy pages are currently authored in English only; do not claim an untranslated Bengali alternate.
    urls.push({ url: `${baseUrl}/en/${page}`, changeFrequency: "monthly", priority: 0.3 });
  }

  if (!supabase) return urls;

  const { data: articles, error } = await supabase
    .from("articles")
    .select("id,slug,published_at,updated_at")
    .eq("status", "published")
    .eq("language", "en")
    .order("published_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("Unable to build article sitemap:", error.message);
    return urls;
  }

  const articleRows = articles ?? [];
  if (!articleRows.length) return urls;

  const { data: translations, error: translationsError } = await supabase
    .from("article_translations")
    .select("language_code, articles!inner(id,slug,updated_at,published_at,status)")
    .eq("translation_status", "published")
    .eq("articles.status", "published")
    .limit(5000);

  const languagesByArticle = new Map<string, Record<string, string>>();
  if (translationsError) {
    console.error("Unable to build translated article sitemap:", translationsError.message);
  } else {
    for (const row of translations ?? []) {
      const joined = row.articles as unknown as
        | { id: string; slug: string; updated_at: string | null; published_at: string | null; status: string }
        | { id: string; slug: string; updated_at: string | null; published_at: string | null; status: string }[]
        | null;
      const article = Array.isArray(joined) ? joined[0] : joined;
      if (!article || article.status !== "published") continue;
      const languages = languagesByArticle.get(article.id) ?? {};
      languages.en = `${baseUrl}/en/article/${article.slug}`;
      languages["x-default"] = languages.en;
      languages[row.language_code] = `${baseUrl}/${row.language_code}/article/${article.slug}`;
      languagesByArticle.set(article.id, languages);
    }
  }

  for (const article of articleRows) {
    const languages = languagesByArticle.get(article.id) ?? { en: `${baseUrl}/en/article/${article.slug}`, "x-default": `${baseUrl}/en/article/${article.slug}` };
    urls.push({
      url: `${baseUrl}/en/article/${article.slug}`,
      lastModified: article.updated_at || article.published_at || undefined,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages },
    });
  }

  if (!translationsError) {
    for (const row of translations ?? []) {
      const joined = row.articles as unknown as
        | { id: string; slug: string; updated_at: string | null; published_at: string | null; status: string }
        | { id: string; slug: string; updated_at: string | null; published_at: string | null; status: string }[]
        | null;
      const article = Array.isArray(joined) ? joined[0] : joined;
      if (!article || article.status !== "published") continue;
      urls.push({
        url: `${baseUrl}/${row.language_code}/article/${article.slug}`,
        lastModified: article.updated_at || article.published_at || undefined,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: { languages: languagesByArticle.get(article.id) ?? { en: `${baseUrl}/en/article/${article.slug}`, "x-default": `${baseUrl}/en/article/${article.slug}` } },
      });
    }
  }

  return urls;
}
