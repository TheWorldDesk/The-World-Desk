"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = { display_name: string | null; role: "editor" | "admin" };
type Article = { id: string; title: string; slug: string; category: string; status: string; excerpt: string | null; content: string | null; image_url: string | null; author_name: string | null; created_at: string };

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("World");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadEditor(id: string) {
    if (!supabase) return;
    const { data: editor, error } = await supabase
      .from("editor_profiles")
      .select("display_name,role")
      .eq("user_id", id)
      .maybeSingle();

    if (error || !editor) {
      setProfile(null);
      setMessage("Your account is signed in, but it has no editor profile. Ask the project owner to grant editor access in Supabase.");
      return;
    }
    setProfile(editor as Profile);
    setAuthor(editor.display_name || "");
    const { data, error: listError } = await supabase
      .from("articles")
      .select("id,title,slug,category,status,excerpt,content,image_url,author_name,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (listError) setMessage("Could not load articles: " + listError.message);
    else setArticles((data ?? []) as Article[]);
  }

  useEffect(() => {
    let active = true;
    async function init() {
      if (!supabase) {
        setMessage("Supabase is not configured. Check the Vercel environment variables.");
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (active && data.session?.user) {
        setUserId(data.session.user.id);
        await loadEditor(data.session.user.id);
      }
      if (active) setLoading(false);
    }
    void init();
    return () => { active = false; };
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage("Sign-in failed: " + error.message);
    } else if (data.user) {
      setUserId(data.user.id);
      await loadEditor(data.user.id);
    }
    setBusy(false);
  }

  async function publishArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !userId || !profile) return;
    setBusy(true);
    setMessage("");
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    const payload = {
      slug: cleanSlug, title: title.trim(), excerpt: excerpt.trim() || null,
      content: content.trim() || null, category, image_url: imageUrl.trim() || null,
      author_name: author.trim() || profile.display_name || "The-World-Desk",
      language: "en", status,
      published_at: status === "published" ? new Date().toISOString() : null,
    };
    const result = editingId
      ? await supabase.from("articles").update(payload).eq("id", editingId)
      : await supabase.from("articles").insert(payload);
    if (result.error) setMessage("Could not save story: " + result.error.message);
    else {
      setMessage(editingId ? "Story updated." : status === "published" ? "Story published." : "Draft saved.");
      setTitle(""); setSlug(""); setExcerpt(""); setContent(""); setImageUrl(""); setEditingId(null);
      await loadEditor(userId);
    }
    setBusy(false);
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setUserId(null); setProfile(null); setArticles([]); setMessage("");
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-10">
      <Link href="/" className="font-bold text-accent">← View site</Link>
      <p className="mt-10 text-xs font-black uppercase tracking-widest text-accent">The-World-Desk newsroom</p>
      <h1 className="mt-2 text-4xl font-black">Editorial workspace</h1>
      <p className="mt-3 max-w-2xl leading-7 text-neutral-600">Sign in with an approved newsroom account to save drafts or publish English stories. Database permissions are enforced by Supabase Row Level Security.</p>

      {message && <p role="status" className="mt-6 border border-black/10 bg-white p-4 text-sm leading-6">{message}</p>}

      {loading ? <p className="mt-8">Checking sign-in…</p> : !userId ? (
        <form onSubmit={signIn} className="mt-8 max-w-lg space-y-4 border border-black/10 bg-white p-6">
          <h2 className="text-xl font-black">Editor sign in</h2>
          <label className="block text-sm font-bold">Email
            <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full border border-black/20 px-3 py-3 font-normal" />
          </label>
          <label className="block text-sm font-bold">Password
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full border border-black/20 px-3 py-3 font-normal" />
          </label>
          <button disabled={busy} className="bg-ink px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
          <p className="text-xs leading-5 text-neutral-500">Accounts are created by the project owner. Public sign-up is disabled on this page.</p>
        </form>
      ) : !profile ? (
        <div className="mt-8 border border-black/10 bg-white p-6">
          <p className="font-bold">Editor access is not assigned to this account yet.</p>
          <button onClick={signOut} className="mt-4 border border-black/20 px-4 py-2 text-sm font-bold">Sign out</button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-black/10 bg-white p-4">
            <p className="text-sm">Signed in as <strong>{profile.display_name || email}</strong> · {profile.role}</p>
            <button onClick={signOut} className="border border-black/20 px-4 py-2 text-sm font-bold">Sign out</button>
          </div>
          <form onSubmit={publishArticle} className="mt-8 grid gap-5 border border-black/10 bg-white p-6">
            <h2 className="text-2xl font-black">{editingId ? "Edit story" : "Write a story"}</h2>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setTitle(""); setSlug(""); setExcerpt(""); setContent(""); setImageUrl(""); setStatus("draft"); setMessage("Edit cancelled."); }} className="justify-self-start border border-black/20 px-4 py-2 text-sm font-bold">Cancel editing</button>}
            <label className="text-sm font-bold">Headline *
              <input required value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} className="mt-2 w-full border border-black/20 px-3 py-3 font-normal" />
            </label>
            <label className="text-sm font-bold">URL slug *
              <input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-2 w-full border border-black/20 px-3 py-3 font-normal" />
            </label>
            <label className="text-sm font-bold">Category
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 w-full border border-black/20 px-3 py-3 font-normal">
                {["World", "Politics", "Business", "Technology", "Science", "Culture", "Health", "Sports"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold">Short summary
              <textarea rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="mt-2 w-full border border-black/20 px-3 py-3 font-normal" />
            </label>
            <label className="text-sm font-bold">Story text
              <textarea rows={10} value={content} onChange={(e) => setContent(e.target.value)} className="mt-2 w-full border border-black/20 px-3 py-3 font-normal" />
            </label>
            <label className="text-sm font-bold">Image URL (optional)
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-2 w-full border border-black/20 px-3 py-3 font-normal" />
            </label>
            <label className="text-sm font-bold">Byline
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-2 w-full border border-black/20 px-3 py-3 font-normal" />
            </label>
            <label className="text-sm font-bold">Action
              <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className="mt-2 w-full border border-black/20 px-3 py-3 font-normal">
                <option value="draft">Save as draft</option><option value="published">Publish now</option>
              </select>
            </label>
            <button disabled={busy} className="justify-self-start bg-accent px-6 py-3 font-bold text-white disabled:opacity-50">{busy ? "Saving…" : editingId ? "Update story" : status === "published" ? "Publish story" : "Save draft"}</button>
          </form>
          <section className="mt-10">
            <h2 className="text-2xl font-black">Recent stories</h2>
            <div className="mt-4 divide-y divide-black/10 border-y border-black/10">
              {articles.length ? articles.map((article) => (
                <div key={article.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div><p className="font-bold">{article.title}</p><p className="mt-1 text-xs text-neutral-500">/{article.slug} · {article.category}</p></div>
                  <div className="flex items-center gap-3"><span className="text-xs font-black uppercase tracking-widest">{article.status}</span><button type="button" onClick={() => { setEditingId(article.id); setTitle(article.title); setSlug(article.slug); setCategory(article.category); setExcerpt(article.excerpt || ""); setContent(article.content || ""); setImageUrl(article.image_url || ""); setAuthor(article.author_name || ""); setStatus(article.status === "published" ? "published" : "draft"); setMessage("Editing selected story."); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="border border-black/20 px-3 py-2 text-xs font-bold">Edit</button></div>
                </div>
              )) : <p className="py-5 text-sm text-neutral-500">No stories yet.</p>}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
