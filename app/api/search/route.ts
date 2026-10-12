import { NextResponse } from "next/server";
import { getPublishedArticles } from "@/lib/news";
import { isLocale } from "@/lib/i18n";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().toLocaleLowerCase();
  const requestedLocale = url.searchParams.get("lang") || "en";
  const locale = isLocale(requestedLocale) ? requestedLocale : "en";
  if (!q) return NextResponse.json({ articles: [], locale });

  const articles = (await getPublishedArticles(locale))
    .filter((article) => [article.title, article.excerpt, article.category, article.content]
      .some((value) => value.toLocaleLowerCase().includes(q)))
    .slice(0, 60);

  return NextResponse.json({ articles, locale });
}
