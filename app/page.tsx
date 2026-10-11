import Link from "next/link";
import { getPublishedArticles } from "@/lib/news";

export const revalidate = 60;

export default async function Home() {
  const articles = await getPublishedArticles();
  const lead = articles[0];

  return (
    <main>
      <div className="bg-ink px-4 py-2 text-center text-xs tracking-widest text-white">
        INDEPENDENT JOURNALISM · GLOBAL PERSPECTIVES
      </div>
      <header className="mx-auto max-w-7xl border-b border-black/10 px-5 py-6">
        <Link href="/" className="text-3xl font-black tracking-tighter sm:text-4xl">The-World-Desk</Link>
        <p className="mt-1 text-xs uppercase tracking-[.3em] text-neutral-500">News that matters</p>
        <nav className="mt-5 flex gap-6 overflow-x-auto border-t border-black/10 pt-4 text-xs font-bold uppercase tracking-widest">
          {["World", "Politics", "Business", "Technology", "Science", "Culture"].map((item) => (
            <a key={item} href="#stories">{item}</a>
          ))}
        </nav>
      </header>

      {lead ? (
        <section className="mx-auto grid max-w-7xl gap-7 px-5 py-8 lg:grid-cols-[1.5fr_1fr]">
          <Link href={"/article/" + lead.slug} className="group relative block min-h-[420px] overflow-hidden bg-neutral-300">
            <img src={lead.image} alt="" className="absolute h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute bottom-0 p-6 text-white sm:p-8">
              <span className="bg-accent px-2 py-1 text-xs font-bold">{lead.category}</span>
              <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">{lead.title}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">{lead.excerpt}</p>
              <p className="mt-4 text-xs text-white/70">{lead.date} · {lead.author}</p>
            </div>
          </Link>
          <aside>
            <h2 className="border-b-2 border-black pb-3 text-sm font-black uppercase tracking-widest">Latest stories</h2>
            {articles.slice(1, 6).map((article) => (
              <article key={article.id} className="grid grid-cols-[100px_1fr] gap-4 border-b border-black/10 py-4">
                <Link href={"/article/" + article.slug}><img src={article.image} alt="" className="h-24 w-full object-cover" /></Link>
                <div>
                  <p className="text-[10px] font-black tracking-widest text-accent">{article.category}</p>
                  <Link href={"/article/" + article.slug} className="mt-2 block font-bold leading-snug hover:text-accent">{article.title}</Link>
                  <p className="mt-2 text-xs text-neutral-500">{article.date}</p>
                </div>
              </article>
            ))}
          </aside>
        </section>
      ) : (
        <section className="mx-auto max-w-4xl px-5 py-24 text-center">
          <p className="text-xs font-black uppercase tracking-[.25em] text-accent">The-World-Desk</p>
          <h1 className="mt-4 text-4xl font-black sm:text-6xl">News that matters.</h1>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-neutral-600">
            Our newsroom is getting ready. Published stories will appear here as soon as the editorial team adds them.
          </p>
          <Link href="/admin" className="mt-8 inline-block bg-ink px-6 py-3 text-sm font-bold text-white">Editorial sign in</Link>
        </section>
      )}

      {articles.length > 1 && (
        <section id="stories" className="mx-auto max-w-7xl px-5 py-8">
          <h2 className="mb-6 border-b-2 border-black pb-3 text-2xl font-black">Stories worth your time</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.slice(1).map((article) => (
              <article key={article.id}>
                <Link href={"/article/" + article.slug}>
                  <img src={article.image} alt="" className="h-52 w-full object-cover" />
                  <p className="mt-4 text-xs font-black tracking-widest text-accent">{article.category}</p>
                  <h3 className="mt-2 text-xl font-black leading-snug hover:text-accent">{article.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{article.excerpt}</p>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer className="bg-ink px-5 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-2xl font-black">The-World-Desk</div>
          <p className="mt-2 text-xs text-white/60">© 2026 The-World-Desk · Independent global journalism</p>
          <Link href="/admin" className="mt-4 inline-block text-xs underline">Editorial sign in</Link>
        </div>
      </footer>
    </main>
  );
}
