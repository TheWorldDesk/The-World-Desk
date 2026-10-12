import { headers } from "next/headers";
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
  author: string;
  translationLanguage?: string;
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

const demoStories: Article[] = [
  ["demo-bangladesh-education","Schools Explore New Ways to Support Student Learning","Education","A sample report about classroom learning and student support.","photo-1503676260728-1c00da094a0b"],
  ["demo-dhaka-city-life","Dhaka’s Changing Streets and Everyday Life","Earth","A sample city feature about commuting and daily life.","photo-1599586120429-48281b6f0b5a"],
  ["demo-climate-rivers","Communities Look for Ways to Protect Riverbanks","Environment","A sample environment feature about riverbank protection.","photo-1470770841072-f978cf4d019e"],
  ["demo-tech-digital-skills","Digital Skills Open New Opportunities for Young People","Technology","A sample technology feature about practical digital skills.","photo-1516321318423-f06f85e504b3"],
  ["demo-business-small-enterprises","Small Businesses Adapt to a Changing Marketplace","Business","A sample business feature about local shops and customers.","photo-1556742049-0cfed4f6a45d"],
  ["demo-world-diplomacy","Diplomacy and Dialogue Remain Central to Global Affairs","World","A sample explainer about diplomacy and international cooperation.","photo-1529107386315-e1a2ed48a620"],
  ["demo-health-wellbeing","Building Healthy Habits Into a Busy Day","Health","A sample wellbeing feature about everyday routines.","photo-1505751172876-fa1923c5c528"],
  ["demo-sports-youth","Youth Sports Help Build Teamwork and Confidence","Sports","A sample sports feature about youth participation.","photo-1461896836934-ffe607ba8211"],
  ["demo-culture-reading","Reading Clubs Bring Neighbours Together","Culture","A sample culture feature about books and community.","photo-1507842217343-583bb7270b66"],
  ["demo-science-space","Why Space Research Matters on Earth","Science","A sample explainer about satellites and space research.","photo-1446776811953-b23d57bd21aa"],
  ["demo-travel-green","Responsible Travel Can Support Local Communities","Travel","A sample travel feature about nature and local culture.","photo-1476514525535-07fb3b4ae5f1"],
  ["demo-agriculture-market","Farmers Balance Weather, Costs and Market Demand","Agriculture","A sample agriculture feature about farm planning.","photo-1500382017468-9049fed747ef"],
  ["demo-transport-safety","Safer Roads Begin With Shared Responsibility","Earth","A sample public-interest feature about road safety.","photo-1494522358652-f30e61a60313"],
  ["demo-media-literacy","How Readers Can Check Information Before Sharing","Technology","A sample guide to checking sources and context.","photo-1455390582262-044cdead277a"],
  ["demo-jobs-career","Practical Skills Can Strengthen Early Careers","Business","A sample careers feature about communication and learning.","photo-1521737711867-e3b97375f902"],
  ["demo-food-heritage","Local Food Traditions Tell Stories of Place","Culture","A sample feature about food heritage and family recipes.","photo-1504674900247-0877df9cc836"],
  ["demo-renewable-energy","Renewable Energy Draws Interest Around the World","Science","A sample explainer about renewable energy planning.","photo-1509391366360-2e959784a276"],
  ["demo-community-volunteers","Community Volunteers Help Neighbourhood Initiatives","Earth","A sample community feature about volunteer work.","photo-1559027615-cd4628902d4a"],
  ["demo-mental-wellbeing","Making Time for Rest in a Busy World","Health","A sample wellbeing feature about rest and support.","photo-1499209974431-9dddcece7f88"],
  ["demo-women-entrepreneurs","Women Entrepreneurs Build Businesses in Their Communities","Business","A sample feature about entrepreneurship.","photo-1551836022-d5d88e9218df"],
  ["demo-wildlife-conservation","Protecting Wildlife Starts With Local Awareness","Environment","A sample environment feature about wildlife conservation.","photo-1472396961693-142e6e269027"],
  ["demo-book-publishing","Independent Writers Find New Ways to Reach Readers","Culture","A sample arts feature about books and readers.","photo-1519682337058-a94d519337bc"],
  ["demo-football-training","Grassroots Football Gives Young Players a Starting Point","Sports","A sample sports feature about coaching and practice.","photo-1522778119026-d647f0596c20"],
  ["demo-cybersecurity-basics","Simple Steps Can Improve Everyday Online Safety","Technology","A sample guide to passwords and online safety.","photo-1550751827-4bd374c3f58b"],
].map(([slug, title, category, excerpt, photo], index) => ({
  id: slug,
  slug,
  category,
  title,
  excerpt: "DEMO STORY — " + excerpt + " This is illustrative website content, not verified current news.",
  content: "DEMO STORY — This article is placeholder content used to test the news website layout. It is not verified current news. Replace it with a fact-checked report before publishing as real journalism. " + excerpt,
  image: `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1400&q=85`,
  date: new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(Date.now() - index * 3600000)),
  author: "The World Desk Demo",
}));

function getRequestedLocale(localeOverride?: string): string {
  if (localeOverride && isLocale(localeOverride)) return localeOverride;
  try {
    const value = headers().get("x-twd-locale");
    return value && isLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function getPublishedArticles(localeOverride?: string): Promise<Article[]> {
  const locale = getRequestedLocale(localeOverride);
  if (!supabase) return demoStories;

  const { data, error } = await supabase
    .from("articles")
    .select("id,slug,category,title,excerpt,content,image_url,author_name,published_at,created_at")
    .eq("status", "published")
    .eq("language", "en")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(30);

  if (error) {
    console.error("Unable to load published articles:", error.message);
    return demoStories;
  }

  if (!data?.length) return demoStories;
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
      author: row.author_name ?? "The World Desk",
      ...(translation ? { translationLanguage: LOCALE_LABELS[locale as keyof typeof LOCALE_LABELS] || locale } : {}),
    };
  });
}
