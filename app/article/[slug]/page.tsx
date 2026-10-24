import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleLanguageAlternates, getPublishedArticles } from "@/lib/news";
import ShareButtons from "@/components/ShareButtons";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

function truncateAtWord(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return cut.slice(0, space > max * 0.6 ? space : max - 1).trimEnd() + "…";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = (await getPublishedArticles()).find((item) => item.slug === slug);
  const languages = await getArticleLanguageAlternates(slug);

  if (!article) return { title: "Story not found", robots: { index: false, follow: false } };

  // A /bn/ URL is only a Bengali-language page when an approved Bengali
  // translation exists. Otherwise the page deliberately falls back to English,
  // and must canonicalize to the English URL to avoid duplicate-language pages.
  const actualLocale = article.requestedLocale !== "en" && article.translationLanguage
    ? article.requestedLocale || "en"
    : "en";
  const canonical = `/${actualLocale}/article/${slug}`;
  const seoTitle = truncateAtWord(article.title, 60);
  const seoDescription = truncateAtWord(article.excerpt || article.title, 155);
  const image = article.image.startsWith("http")
    ? article.image
    : `https://the-world-desk.vercel.app${article.image.startsWith("/") ? "" : "/"}${article.image}`;

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical, ...(languages ? { languages } : {}) },
    openGraph: {
      type: "article",
      url: canonical,
      title: seoTitle,
      description: seoDescription,
      locale: actualLocale === "bn" ? "bn_BD" : "en_US",
      publishedTime: article.publishedAt,
      authors: [article.author],
      images: [{ url: image, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: [image],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const articles = await getPublishedArticles();
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://the-world-desk.vercel.app").replace(/\/$/, "");
  const actualLocale = article.requestedLocale !== "en" && article.translationLanguage
    ? article.requestedLocale || "en"
    : "en";
  const canonicalUrl = `${siteUrl}/${actualLocale}/article/${article.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: [article.image],
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: {
      "@type": article.author === "The World Desk" ? "Organization" : "Person",
      name: article.author,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "The World Desk",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/icon.svg` },
    },
    articleSection: article.category,
    inLanguage: actualLocale,
    isAccessibleForFree: true,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/${actualLocale}` },
      { "@type": "ListItem", position: 2, name: article.category, item: `${siteUrl}/${actualLocale}/section/${article.category.toLowerCase().replace(/\s+/g, "-")}` },
      { "@type": "ListItem", position: 3, name: article.title, item: canonicalUrl },
    ],
  };
  const related = articles.filter((item) => item.slug !== slug).slice(0, 3);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }} />
      <header className="wrap masthead">
        <div className="masthead-row">
          <Link href="/" className="brand"><span className="brand-mark">W</span><span>THE WORLD<span className="brand-second">DESK</span><small>NEWS · CONTEXT · PERSPECTIVE</small></span></Link>
          <Link href="/latest">Latest news →</Link>
        </div>
        <nav className="nav">
          <Link href="/">Home</Link><Link href="/section/world">World</Link><Link href="/section/africa">Africa</Link><Link href="/section/asia">Asia</Link><Link href="/section/europe">Europe</Link><Link href="/section/earth">Earth</Link><Link href="/section/politics">Politics</Link><Link href="/section/business">Business</Link><Link href="/section/technology">Technology</Link><Link href="/section/sports">Sports</Link>
        </nav>
      </header>
      <article className="article-body">
        <Link href="/" className="category-label">← Back to front page</Link>
        <p className="category-label">{article.displayCategory || article.category}</p>
        {article.requestedLocale && article.requestedLocale !== "en" && !article.translationLanguage && <p className="text-xs text-neutral-500">No reviewed {article.requestedLocale} translation is published yet; showing the original English text.</p>}
        <h1>{article.title}</h1>
        {article.excerpt && <p className="standfirst">{article.excerpt}</p>}
        <div className="article-meta">{article.timeAgo} · {article.date} · {article.author}</div>
        <ShareButtons title={article.title} url={canonicalUrl} />
        {article.sourceUrl && <p className="text-sm text-neutral-600 mt-3">Source: <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{article.sourceName || "Original report"} ↗</a></p>}
        <img className="hero" src={article.image} alt={article.title} />
        <p className="text-xs text-neutral-500">Illustrative image; it does not necessarily depict the specific event described.</p>
        <div className="prose">{article.content.split(/\n\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        <div className="border-t border-neutral-200 pt-6 mt-10">
          <strong>Explore more stories</strong>
          <div className="article-list mt-5">{related.map((item) => <div key={item.id}><Link href={"/article/" + item.slug}><img src={item.image} alt={item.title} /><span className="category-label">{item.category}</span><h2>{item.title}</h2></Link></div>)}</div>
        </div>
      </article>
      <footer className="footer"><div className="wrap"><div className="footer-brand">THE WORLD DESK</div><div className="footer-links"><Link href="/">Home</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/editorial-standards">Editorial standards</Link><Link href="/corrections">Corrections</Link></div><small>© {new Date().getFullYear()} The World Desk</small></div></footer>
    </main>
  );
}
