import { headers } from "next/headers";
// Next.js 15+ exposes request headers asynchronously.
import { supabase } from "@/lib/supabase";
import { DEFAULT_LOCALE, isLocale, LOCALE_LABELS } from "@/lib/i18n";

export type Article = {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  publishedAt?: string;
  author: string;
  translationLanguage?: string;
  requestedLocale?: string;
};

type ArticleRow = {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
};

type TranslationRow = {
  article_id: string;
  language_code: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  translation_status: string;
};


async function getRequestedLocale(localeOverride?: string): Promise<string> {
  if (localeOverride && isLocale(localeOverride)) return localeOverride;
  try {
    const value = (await headers()).get("x-twd-locale");
    return value && isLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function getPublishedArticles(localeOverride?: string): Promise<Article[]> {
  const locale = await getRequestedLocale(localeOverride);
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("articles")
    .select("id,slug,category,title,excerpt,content,image_url,author_name,published_at,created_at")
    .eq("status", "published")
    .eq("language", "en")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(30);

  if (error) {
    console.error("Unable to load published articles:", error.message);
    return [];
  }

  if (!data?.length) return [];
  const rows = data as ArticleRow[];
  const translations = new Map<string, TranslationRow>();

  if (locale !== "en") {
    const { data: translatedRows, error: translationError } = await supabase
      .from("article_translations")
      .select("article_id,language_code,title,excerpt,content,category,translation_status")
      .eq("language_code", locale)
      .eq("translation_status", "published")
      .in("article_id", rows.map((row) => row.id));

    if (translationError) {
      // Keep original articles available if translations are not configured or query fails.
      console.error("Unable to load published article translations:", translationError.message);
    } else {
      for (const row of (translatedRows ?? []) as TranslationRow[]) {
        translations.set(row.article_id, row);
      }
    }
  }

  const dateLocale = locale === "zh-CN" || locale === "zh-TW" ? locale : locale;
  return rows.map((row) => {
    const translation = translations.get(row.id);
    return {
      id: row.id,
      slug: row.slug,
      category: translation?.category || row.category,
      title: translation?.title || row.title,
      excerpt: translation?.excerpt ?? row.excerpt ?? "",
      content: translation?.content || row.content || "",
      image: row.image_url ?? "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=85",
      date: new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium" }).format(
        new Date(row.published_at ?? row.created_at),
      ),
      publishedAt: row.published_at ?? row.created_at,
      author: row.author_name ?? "The World Desk",
      requestedLocale: locale,
      ...(translation ? { translationLanguage: LOCALE_LABELS[locale as keyof typeof LOCALE_LABELS] || locale } : {}),
    };
  });
}
