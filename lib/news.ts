import { supabase } from "@/lib/supabase";

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

export async function getPublishedArticles(): Promise<Article[]> {
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

  return (data as ArticleRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    category: row.category,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    image: row.image_url ?? "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=85",
    date: new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
      new Date(row.published_at ?? row.created_at),
    ),
    author: row.author_name ?? "The-World-Desk",
  }));
}
