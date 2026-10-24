import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedArticles } from "@/lib/news";
import { headers } from "next/headers";

const sections = ["world", "africa", "asia", "europe", "middle-east", "north-america", "latin-america", "earth", "politics", "business", "technology", "science", "climate", "health", "sports", "culture", "environment", "education", "travel", "agriculture"];
type Props = { params: Promise<{ category: string }> };

function sectionTitle(category: string) {
  return category.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const key = decodeURIComponent(category).toLowerCase();
  const locale = (await headers()).get("x-twd-locale") || "en";
  const title = sectionTitle(key);
  const articles = await getPublishedArticles();
  const hasStories = articles.some((article) => article.category.toLowerCase() === key);

  if (locale === "bn") {
    const bn: Record<string, string> = { world: "বিশ্ব", africa: "আফ্রিকা", asia: "এশিয়া", europe: "ইউরোপ", "middle-east": "মধ্যপ্রাচ্য", "north-america": "উত্তর আমেরিকা", "latin-america": "লাতিন আমেরিকা", earth: "পৃথিবী", politics: "রাজনীতি", business: "ব্যবসা", technology: "প্রযুক্তি", science: "বিজ্ঞান", climate: "জলবায়ু", health: "স্বাস্থ্য", sports: "খেলাধুলা", culture: "সংস্কৃতি", environment: "পরিবেশ", education: "শিক্ষা", travel: "ভ্রমণ", agriculture: "কৃষি" };
    const localized = bn[key] || title;
    return {
      title: localized + " সংবাদ ও সর্বশেষ আপডেট",
      description: "বাংলাদেশ ও বিশ্বজুড়ে " + localized + " বিষয়ে সর্বশেষ খবর, গুরুত্বপূর্ণ ঘটনা, প্রেক্ষাপট ও বিশ্লেষণ পড়ুন The World Desk-এ।",
      ...(!hasStories ? { robots: { index: false, follow: true } } : {}),
    };
  }

  return {
    title: title + " News, Analysis & Updates",
    description: "Latest " + title + " news, verified developments, expert context and in-depth reporting from The World Desk, covering key events around the world.",
    ...(!hasStories ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function SectionPage({ params }: Props) {
  const { category } = await params;
  const key = decodeURIComponent(category).toLowerCase();
  if (!sections.includes(key)) notFound();

  const title = sectionTitle(key);
  const all = await getPublishedArticles();
  const articles = all.filter((article) => article.category.toLowerCase() === key);

  return (
    <main>
      <header className="wrap masthead">
        <div className="masthead-row">
          <Link href="/" className="brand"><span className="brand-mark">W</span><span>THE WORLD<span className="brand-second">DESK</span><small>INTERNATIONAL NEWS · ANALYSIS · PERSPECTIVE</small></span></Link>
          <Link href="/search">Search news ⌕</Link>
        </div>
        <nav className="nav">
          {["world", "africa", "asia", "europe", "middle-east", "north-america", "latin-america", "politics", "business", "technology", "science", "climate", "health", "sports", "culture", "earth"].map((section) => <Link key={section} href={"/section/" + section}>{sectionTitle(section)}</Link>)}
        </nav>
      </header>
      <div className="wrap">
        <div className="page-intro"><span className="category-label">GLOBAL COVERAGE / SECTION</span><h1>{title}</h1><p>News, reporting and perspectives from {["africa", "asia", "europe", "middle-east", "north-america", "latin-america"].includes(key) ? "across " + title : "around the world"}.</p></div>
        {articles.length ? <div className="article-list search-results">{articles.map((article) => <article key={article.id}><Link href={"/article/" + article.slug}><img src={article.image} alt={article.title} /><span className="category-label">{article.displayCategory || article.category}</span><h2>{article.title}</h2><p>{article.excerpt}</p><small>{article.timeAgo} · {article.date}</small></Link></article>)}</div> : <div className="page-content"><h2>No stories in this section yet</h2><p>There are no published stories in this section yet. Explore the latest coverage from the global newsroom.</p><Link href="/latest">Explore latest news →</Link></div>}
        <div className="page-content"><Link href="/">← Back to homepage</Link></div>
      </div>
      <footer className="footer"><div className="wrap"><div className="footer-brand">THE WORLD DESK</div><p>Independent journalism. Global perspectives.</p><div className="footer-links"><Link href="/about">About us</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div></footer>
    </main>
  );
}
