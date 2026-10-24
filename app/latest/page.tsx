import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/news";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await headers()).get("x-twd-locale") || "en";
  const hasStories = (await getPublishedArticles()).length > 0;
  const localized: Metadata = locale === "bn"
    ? { title: "বাংলাদেশ ও বিশ্বের সর্বশেষ খবর", description: "বাংলাদেশ ও বিশ্বের সর্বশেষ সংবাদ, গুরুত্বপূর্ণ ঘটনা, রাজনীতি, অর্থনীতি ও আন্তর্জাতিক পরিস্থিতির নির্ভরযোগ্য আপডেট পড়ুন The World Desk-এ।" }
    : { title: "Latest World News & Global Updates", description: "Read the latest world news, breaking developments, international politics, business, technology and in-depth analysis from The World Desk." };

  return {
    ...localized,
    ...(!hasStories ? { robots: { index: false, follow: true } } : {}),
  };
}

export const revalidate = 60;

export default async function Latest() {
  const locale = (await headers()).get("x-twd-locale") || "en";
  const bn = locale === "bn";
  const articles = await getPublishedArticles();

  return (
    <main>
      <header className="wrap masthead">
        <div className="masthead-row">
          <Link href="/" className="brand"><span className="brand-mark">W</span><span>THE WORLD<span className="brand-second">DESK</span><small>NEWS · CONTEXT · PERSPECTIVE</small></span></Link>
          <Link href="/search">{bn ? "সংবাদ খুঁজুন ⌕" : "Search news ⌕"}</Link>
        </div>
        <nav className="nav">
          {["world", "africa", "asia", "europe", "middle-east", "north-america", "latin-america", "earth", "politics", "business", "technology", "science", "climate", "health", "sports", "culture", "environment"].map((section) => <Link key={section} href={"/section/" + section}>{section.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")}</Link>)}
        </nav>
      </header>
      <div className="wrap">
        <div className="page-intro"><span className="category-label">{bn ? "সর্বশেষ আপডেট" : "UPDATED COVERAGE"}</span><h1>{bn ? "সর্বশেষ খবর" : "Latest News"}</h1><p>{bn ? "The World Desk-এর সবশেষ খবর এক জায়গায়।" : "The latest stories from The World Desk, in one place."}</p></div>
        {articles.length ? <div className="article-list search-results">{articles.map((article) => <article key={article.id}><Link href={"/article/" + article.slug}><img src={article.image} alt={article.title} /><span className="category-label">{article.displayCategory || article.category}</span><h2>{article.title}</h2><p>{article.excerpt}</p><small>{article.timeAgo} · {article.date}</small></Link></article>)}</div> : <div className="page-content"><h2>{bn ? "এখনও কোনো খবর প্রকাশিত হয়নি" : "No stories published yet"}</h2><p>{bn ? "নিউজরুম খবর প্রকাশ করলে সেগুলো এখানে দেখা যাবে।" : "Published newsroom stories will appear here."}</p></div>}
      </div>
      <footer className="footer"><div className="wrap"><div className="footer-brand">THE WORLD DESK</div><div className="footer-links"><Link href="/">Home</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link></div></div></footer>
    </main>
  );
}
