import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const revalidate = 60;

type Article = {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string;
  image_url: string | null;
  author_name: string | null;
  published_at: string | null;
};

async function getArticle(slug: string): Promise<Article | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("articles")
    .select("slug,title,excerpt,content,category,image_url,author_name,published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("language", "en")
    .maybeSingle();

  if (error) {
    console.error("Unable to load article:", error.message);
    return null;
  }
  return data as Article | null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return { title: "Story not found" };
  return {
    title: article.title,
    description: article.excerpt ?? article.title,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt ?? article.title,
      images: article.image_url ? [article.image_url] : [],
      publishedTime: article.published_at ?? undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const date = article.published_at
    ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(article.published_at))
    : "";

  return (
    <main className="min-h-screen">
      <header className="mx-auto max-w-4xl px-5 py-7">
        <Link href="/" className="text-2xl font-black tracking-tighter">The-World-Desk</Link>
        <p className="mt-1 text-xs uppercase tracking-[.25em] text-neutral-500">Independent journalism · Global perspectives</p>
      </header>
      <article className="mx-auto max-w-4xl px-5 pb-20">
        <Link href="/" className="text-sm font-bold text-accent">← Back to front page</Link>
        <p className="mt-8 text-xs font-black uppercase tracking-[.2em] text-accent">{article.category}</p>
        <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">{article.title}</h1>
        {article.excerpt && <p className="mt-5 text-xl leading-8 text-neutral-600">{article.excerpt}</p>}
        <p className="mt-5 text-sm text-neutral-500">{article.author_name ?? "The-World-Desk"}{date ? " · " + date : ""}</p>
        {article.image_url && <img src={article.image_url} alt="" className="mt-8 max-h-[560px] w-full object-cover" />}
        <div className="prose prose-lg mt-10 max-w-none whitespace-pre-wrap leading-8">
          {article.content || article.excerpt || ""}
        </div>
      </article>
      <footer className="bg-ink px-5 py-8 text-center text-sm text-white/70">© 2026 The-World-Desk</footer>
    </main>
  );
}
