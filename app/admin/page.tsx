"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "@/lib/i18n";

type Profile = { display_name: string | null; role: "editor" | "admin" };
type Article = {
  id: string; title: string; slug: string; category: string; status: string;
  excerpt: string | null; content: string | null; image_url: string | null;
  author_name: string | null; created_at: string; published_at?: string | null; scheduled_at?: string | null;
};
type Translation = {
  article_id: string; language_code: string; title: string; excerpt: string | null;
  content: string | null; translation_status: string;
};
type Revision = { id: number; article_id: string; snapshot: Record<string, unknown>; changed_at: string; changed_by: string | null };
type EditorProfile = { user_id: string; display_name: string | null; role: "admin" | "editor"; created_at?: string };
type Tab = "dashboard" | "articles" | "write" | "translations" | "sections" | "seo" | "settings";
const CATEGORIES = ["World", "Politics", "Business", "Technology", "Science", "Health", "Sports", "Culture", "Climate", "Africa", "Asia", "Europe", "Middle East", "North America", "Latin America", "Earth"];
const inputClass = "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const cardClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const buttonClass = "rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [breakingEnabled, setBreakingEnabled] = useState(false);
  const [breakingEn, setBreakingEn] = useState("");
  const [breakingBn, setBreakingBn] = useState("");
  const [sectionOrder, setSectionOrder] = useState<string[]>(["World", "Politics", "Business", "Technology", "Science", "Health", "Sports", "Culture"]);
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [mediaItems, setMediaItems] = useState<{name:string; url:string; path:string}[]>([]);
  const [editorProfiles, setEditorProfiles] = useState<EditorProfile[]>([]);
  const [profileUserId, setProfileUserId] = useState("");
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileRole, setProfileRole] = useState<"admin" | "editor">("editor");
  const [revisionRows, setRevisionRows] = useState<Revision[]>([]);
  const [revisionArticleId, setRevisionArticleId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [bnTitle, setBnTitle] = useState("");
  const [bnExcerpt, setBnExcerpt] = useState("");
  const [bnContent, setBnContent] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("World");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "scheduled">("draft");
  const [scheduledDate, setScheduledDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [translationArticleId, setTranslationArticleId] = useState("");
  const [translationLanguage, setTranslationLanguage] = useState("bn");
  const [translationTitle, setTranslationTitle] = useState("");
  const [translationExcerpt, setTranslationExcerpt] = useState("");
  const [translationContent, setTranslationContent] = useState("");
  const [translationStatus, setTranslationStatus] = useState<"draft" | "review" | "published">("draft");

  const loadEditor = useCallback(async (id: string) => {
    if (!supabase) return;
    const { data: editor, error } = await supabase.from("editor_profiles")
      .select("display_name,role").eq("user_id", id).maybeSingle();
    if (error || !editor || !["admin", "editor"].includes(editor.role)) {
      setProfile(null);
      setMessage("এই অ্যাকাউন্টে newsroom access নেই। Supabase-এ editor_profiles থেকে অনুমতি দিতে হবে।");
      return;
    }
    setProfile(editor as Profile);
    setAuthor(editor.display_name || "");
    const [articleResult, translationResult] = await Promise.all([
      supabase.from("articles")
        .select("id,title,slug,category,status,excerpt,content,image_url,author_name,created_at,published_at,scheduled_at")
        .order("created_at", { ascending: false }).limit(200),
      supabase.from("article_translations")
        .select("article_id,language_code,title,excerpt,content,translation_status")
        .order("updated_at", { ascending: false }).limit(1000),
    ]);
    if (articleResult.error) setMessage("খবর লোড করা যায়নি: " + articleResult.error.message);
    else setArticles((articleResult.data ?? []) as Article[]);
    if (translationResult.error) {
      setTranslations([]);
      setMessage((old) => old || "অনুবাদের তালিকা লোড করা যায়নি: " + translationResult.error.message);
    } else setTranslations((translationResult.data ?? []) as Translation[]);
    const mediaBucket = supabase.storage.from("newsroom-media");
    const { data: mediaFolders } = await mediaBucket.list(id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    setMediaItems((mediaFolders ?? []).filter((item) => item.name && item.id).map((item) => { const path = `${id}/${item.name}`; return { name: item.name, path, url: mediaBucket.getPublicUrl(path).data.publicUrl }; }));
    if (editor?.role === "admin") {
      const { data: profilesData } = await supabase.from("editor_profiles").select("user_id,display_name,role,created_at").order("created_at", { ascending: true });
      setEditorProfiles((profilesData ?? []) as EditorProfile[]);
    } else setEditorProfiles([]);
    const { data: settingsRow, error: settingsError } = await supabase.from("site_settings").select("settings").eq("id", "global").maybeSingle();
    const { data: revisionData } = await supabase.from("article_revisions").select("id,article_id,snapshot,changed_at,changed_by").order("changed_at", { ascending: false }).limit(300);
    setRevisionRows((revisionData ?? []) as Revision[]);
    if (!settingsError && settingsRow?.settings) {
      const settings = settingsRow.settings as { breaking_news_enabled?: boolean; breaking_news_text_en?: string; breaking_news_text_bn?: string; homepage_section_order?: string[]; homepage_featured_article_ids?: string[] };
      setBreakingEnabled(Boolean(settings.breaking_news_enabled));
      setBreakingEn(settings.breaking_news_text_en || "");
      setBreakingBn(settings.breaking_news_text_bn || "");
      setSectionOrder(settings.homepage_section_order?.length ? settings.homepage_section_order : ["World", "Politics", "Business", "Technology", "Science", "Health", "Sports", "Culture"]);
      setFeaturedIds(settings.homepage_featured_article_ids || []);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      if (!supabase) {
        setMessage("Supabase কনফিগার করা নেই। Vercel environment variables পরীক্ষা করো।");
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
  }, [loadEditor]);

  const published = articles.filter((a) => a.status === "published");
  const drafts = articles.filter((a) => a.status !== "published");
  const reviewTranslations = translations.filter((t) => t.translation_status === "review");
  const filteredArticles = useMemo(() => articles.filter((article) => {
    const matchesQuery = !query || [article.title, article.slug, article.author_name || "", article.category]
      .some((value) => value.toLowerCase().includes(query.toLowerCase()));
    const matchesStatus = statusFilter === "all" || (statusFilter === "scheduled" ? article.status === "draft" && Boolean(article.scheduled_at) : statusFilter === "draft" ? article.status === "draft" && !article.scheduled_at : article.status === statusFilter);
    const matchesCategory = categoryFilter === "all" || article.category === categoryFilter;
    return matchesQuery && matchesStatus && matchesCategory;
  }), [articles, query, statusFilter, categoryFilter]);
  const seoIssues = articles.filter((a) => a.status === "published" && (!a.excerpt?.trim() || !a.image_url?.trim() || !a.slug.trim()));

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage("Sign-in ব্যর্থ: " + error.message);
    else if (data.user) {
      setUserId(data.user.id);
      await loadEditor(data.user.id);
    }
    setBusy(false);
  }

  function resetEditor() {
    setEditingId(null); setTitle(""); setBnTitle(""); setBnExcerpt(""); setBnContent("");
    setSlug(""); setCategory("World"); setExcerpt(""); setContent(""); setImageUrl("");
    setStatus("draft"); setScheduledDate(""); setTab("write");
  }

  async function startEditing(article: Article) {
    if (!supabase) return;
    setEditingId(article.id); setTitle(article.title); setSlug(article.slug); setCategory(article.category);
    setExcerpt(article.excerpt || ""); setContent(article.content || ""); setImageUrl(article.image_url || "");
    setAuthor(article.author_name || ""); setStatus(article.status === "published" ? "published" : article.scheduled_at ? "scheduled" : "draft"); setScheduledDate(article.scheduled_at ? new Date(Date.parse(article.scheduled_at) - new Date(article.scheduled_at).getTimezoneOffset() * 60000).toISOString().slice(0,16) : "");
    const { data } = await supabase.from("article_translations")
      .select("title,excerpt,content").eq("article_id", article.id).eq("language_code", "bn").maybeSingle();
    setBnTitle(data?.title || ""); setBnExcerpt(data?.excerpt || ""); setBnContent(data?.content || "");
    setMessage("খবরটি সম্পাদনার জন্য খোলা হয়েছে।");
    setTab("write"); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !userId || !profile) return;
    if (!title.trim() || !content.trim() || !bnTitle.trim() || !bnContent.trim()) {
      setMessage("ইংরেজি ও বাংলা—দুই সংস্করণের শিরোনাম এবং মূল খবর পূরণ করো।"); return;
    }
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
    if (!cleanSlug) { setMessage("ইংরেজি অক্ষর, সংখ্যা ও হাইফেন দিয়ে URL slug দাও।"); return; }
    if (status === "scheduled" && (!scheduledDate || new Date(scheduledDate).getTime() <= Date.now())) { setMessage("Scheduled publishing-এর জন্য ভবিষ্যতের একটি তারিখ ও সময় বেছে নাও।"); return; }
    setBusy(true); setMessage("");
    const now = new Date().toISOString();
    const payload = {
      slug: cleanSlug, title: title.trim(), excerpt: excerpt.trim() || null, content: content.trim(),
      category, image_url: imageUrl.trim() || null, author_name: author.trim() || profile.display_name || "The World Desk",
      language: "en", status: "draft", published_at: null,
      scheduled_at: status === "scheduled" && scheduledDate ? new Date(scheduledDate).toISOString() : null,
    };
    const result = editingId
      ? await supabase.from("articles").update(payload).eq("id", editingId).select("id").single()
      : await supabase.from("articles").insert(payload).select("id").single();
    if (result.error || !result.data?.id) {
      setMessage("ইংরেজি খবর সংরক্ষণ হয়নি: " + (result.error?.message || "Article ID পাওয়া যায়নি।"));
      setBusy(false); return;
    }
    const articleId = result.data.id as string;
    const translationResult = await supabase.from("article_translations").upsert({
      article_id: articleId, language_code: "bn", title: bnTitle.trim(),
      excerpt: bnExcerpt.trim() || null, content: bnContent.trim(), translation_status: "draft",
      translated_by: email || "editor", reviewed_by: null, updated_at: now,
    }, { onConflict: "article_id,language_code" });
    if (translationResult.error) {
      setMessage("ইংরেজি Draft সেভ হয়েছে, কিন্তু বাংলা সংস্করণ সেভ হয়নি: " + translationResult.error.message);
      await loadEditor(userId); setBusy(false); return;
    }
    if (status === "published") {
      const banglaPublish = await supabase.from("article_translations").update({
        translation_status: "published", reviewed_by: userId, updated_at: new Date().toISOString(),
      }).eq("article_id", articleId).eq("language_code", "bn");
      if (banglaPublish.error) {
        setMessage("দুটি সংস্করণ সেভ হয়েছে, কিন্তু বাংলা প্রকাশ হয়নি: " + banglaPublish.error.message);
        await loadEditor(userId); setBusy(false); return;
      }
      const englishPublish = await supabase.from("articles").update({
        status: "published", published_at: new Date().toISOString(),
      }).eq("id", articleId);
      if (englishPublish.error) {
        await supabase.from("article_translations").update({ translation_status: "draft", reviewed_by: null })
          .eq("article_id", articleId).eq("language_code", "bn");
        setMessage("ইংরেজি প্রকাশ ব্যর্থ: " + englishPublish.error.message + "। বাংলা Draft-এ ফিরিয়ে নেওয়া হয়েছে।");
        await loadEditor(userId); setBusy(false); return;
      }
    }
    setMessage(status === "published" ? "ইংরেজি ও বাংলা—দুই সংস্করণ প্রকাশিত হয়েছে।" : status === "scheduled" ? "খবরটি নির্ধারিত সময়ে প্রকাশের জন্য Schedule করা হয়েছে।" : "দুই ভাষার Draft সংরক্ষিত হয়েছে।");
    setEditingId(null); setTitle(""); setBnTitle(""); setBnExcerpt(""); setBnContent(""); setSlug("");
    setExcerpt(""); setContent(""); setImageUrl(""); setStatus("draft"); setScheduledDate("");
    await loadEditor(userId); setBusy(false); setTab("articles");
  }

  async function changePublishState(article: Article) {
    if (!supabase || !userId) return;
    setBusy(true); setMessage("");
    if (article.status === "published") {
      const { error } = await supabase.from("articles").update({ status: "draft", published_at: null, scheduled_at: null }).eq("id", article.id);
      if (error) setMessage("Unpublish ব্যর্থ: " + error.message);
      else setMessage("খবরটি Draft-এ ফিরিয়ে নেওয়া হয়েছে।");
    } else {
      const { error } = await supabase.from("articles").update({ status: "published", published_at: new Date().toISOString(), scheduled_at: null }).eq("id", article.id);
      if (error) setMessage("প্রকাশ ব্যর্থ: " + error.message);
      else setMessage("ইংরেজি খবর প্রকাশিত হয়েছে। বাংলা অনুবাদ আলাদাভাবে যাচাই করো।");
    }
    await loadEditor(userId); setBusy(false);
  }

  async function saveTranslation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !userId || !profile || !translationArticleId) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.from("article_translations").upsert({
      article_id: translationArticleId, language_code: translationLanguage,
      title: translationTitle.trim(), excerpt: translationExcerpt.trim() || null,
      content: translationContent.trim(), translation_status: translationStatus,
      translated_by: email || "editor", reviewed_by: translationStatus === "published" ? userId : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "article_id,language_code" });
    setMessage(error ? "অনুবাদ সংরক্ষণ হয়নি: " + error.message :
      translationStatus === "published" ? "অনুবাদ প্রকাশিত হয়েছে।" :
      translationStatus === "review" ? "অনুবাদ Review queue-তে পাঠানো হয়েছে।" : "অনুবাদের Draft সংরক্ষিত হয়েছে।");
    await loadEditor(userId); setBusy(false);
  }

  async function autoTranslateArticle(articleId: string) {
    if (!supabase || !userId || !profile) return;
    setBusy(true); setMessage("স্বয়ংক্রিয় অনুবাদ তৈরি হচ্ছে…");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const { data: source, error } = await supabase.from("articles").select("title,excerpt,content").eq("id", articleId).maybeSingle();
    if (error || !source || !token) { setMessage("মূল খবর বা editor session পাওয়া যায়নি।"); setBusy(false); return; }
    const languages = SUPPORTED_LOCALES.filter((language) => language !== "en");
    let saved = 0; const failures: string[] = [];
    for (const language of languages) {
      setMessage("অনুবাদ হচ্ছে: " + language + " (" + (saved + failures.length + 1) + "/" + languages.length + ")");
      try {
        const response = await fetch("/api/translate", {
          method: "POST", headers: { "content-type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ articleId, targetLanguage: language, save: true, title: source.title, excerpt: source.excerpt || "", content: source.content || "" }),
        });
        const payload = await response.json();
        if (!response.ok) failures.push(language + ": " + (payload.error || response.status)); else saved += 1;
      } catch { failures.push(language + ": network error"); }
    }
    setMessage("অনুবাদ শেষ: " + saved + "/" + languages.length + " ভাষায় Draft তৈরি হয়েছে।" +
      (failures.length ? " ব্যর্থ: " + failures.join(", ") : "") + " প্রকাশের আগে Translation Desk-এ যাচাই করো।");
    await loadEditor(userId); setBusy(false);
  }

  async function saveSiteSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !userId || profile?.role !== "admin") { setMessage("Homepage settings পরিবর্তনের জন্য admin role প্রয়োজন।"); return; }
    setBusy(true);
    const settings = { breaking_news_enabled: breakingEnabled, breaking_news_text_en: breakingEn.trim(), breaking_news_text_bn: breakingBn.trim(), homepage_section_order: sectionOrder, homepage_featured_article_ids: featuredIds };
    const { error } = await supabase.from("site_settings").upsert({ id: "global", settings, updated_at: new Date().toISOString(), updated_by: userId }, { onConflict: "id" });
    setMessage(error ? "Settings সংরক্ষণ হয়নি: " + error.message : "Homepage settings database-এ সংরক্ষিত হয়েছে। Public homepage-এ প্রয়োগ করতে homepage integration-ও থাকতে হবে।");
    setBusy(false);
  }

  async function uploadMedia(file: File | null) {
    if (!supabase || !userId || !profile || !file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) { setMessage("শুধু image file (সর্বোচ্চ 10 MB) আপলোড করা যাবে।"); return; }
    setBusy(true); setMessage("ছবি আপলোড হচ্ছে…");
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const path = `${userId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("newsroom-media").upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
    if (error) { setMessage("Upload ব্যর্থ: " + error.message + "। Database migration এবং Storage policy প্রয়োগ হয়েছে কি না যাচাই করো।"); setBusy(false); return; }
    const { data } = supabase.storage.from("newsroom-media").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setMediaItems((items) => [{ name: file.name, path, url: data.publicUrl }, ...items]);
    setMessage("ছবি আপলোড হয়েছে এবং Featured image URL-এ বসানো হয়েছে। Article save করতে হবে।");
    setBusy(false);
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setUserId(null); setProfile(null); setArticles([]); setTranslations([]); setMessage("");
  }

  async function manageEditorProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || profile?.role !== "admin" || !profileUserId.trim()) { setMessage("শুধু Admin newsroom user role পরিচালনা করতে পারবেন।"); return; }
    setBusy(true); setMessage("");
    const { error } = await supabase.from("editor_profiles").upsert({ user_id: profileUserId.trim(), display_name: profileDisplayName.trim() || null, role: profileRole }, { onConflict: "user_id" });
    if (error) setMessage("User role update হয়নি: " + error.message + "। UUID-টি Supabase Auth-এ থাকা user-এর হতে হবে।");
    else { setMessage("Newsroom user role সংরক্ষিত হয়েছে।"); setProfileUserId(""); setProfileDisplayName(""); const { data } = await supabase.from("editor_profiles").select("user_id,display_name,role,created_at").order("created_at", { ascending: true }); setEditorProfiles((data ?? []) as EditorProfile[]); }
    setBusy(false);
  }

  async function deleteMedia(item: {name:string; url:string; path:string}) {
    if (!supabase || profile?.role !== "admin") return;
    if (!window.confirm(`Delete media file “${item.name}”? Articles using this image may show a broken image.`)) return;
    setBusy(true); const { error } = await supabase.storage.from("newsroom-media").remove([item.path]);
    if (error) setMessage("Media delete ব্যর্থ: " + error.message);
    else { setMediaItems((items) => items.filter((media) => media.path !== item.path)); setMessage("Media file মুছে ফেলা হয়েছে।"); }
    setBusy(false);
  }

  async function restoreRevision(row: Revision) {
    if (!supabase || !userId || !profile || profile.role !== "admin") return;
    const snapshot = row.snapshot as Record<string, unknown>;
    if (!window.confirm("এই revision restore করলে বর্তমান article content বদলে যাবে। চালিয়ে যাবে?")) return;
    const nullableText = (value: unknown): string | null => typeof value === "string" ? value : null;
    const restoredStatus = ["draft", "published", "archived"].includes(String(snapshot.status))
      ? String(snapshot.status) as "draft" | "published" | "archived" : "draft";
    setBusy(true); setMessage("");
    const { error } = await supabase.from("articles").update({
      title: String(snapshot.title ?? ""), slug: String(snapshot.slug ?? ""), category: String(snapshot.category ?? "World"),
      status: restoredStatus, excerpt: nullableText(snapshot.excerpt), content: nullableText(snapshot.content),
      image_url: nullableText(snapshot.image_url), author_name: nullableText(snapshot.author_name),
      published_at: nullableText(snapshot.published_at), scheduled_at: null,
    }).eq("id", row.article_id);
    if (error) setMessage("Revision restore ব্যর্থ: " + error.message);
    else { setMessage("Revision restore হয়েছে; বর্তমান সংস্করণও history-তে সংরক্ষিত হয়েছে।"); await loadEditor(userId); }
    setBusy(false);
  }

  const nav: { id: Tab; label: string; icon: string; hint?: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "articles", label: "Articles", icon: "▤" },
    { id: "write", label: "Write Article", icon: "＋" },
    { id: "translations", label: "Translation Desk", icon: "文", hint: reviewTranslations.length ? String(reviewTranslations.length) : undefined },
    { id: "sections", label: "Categories", icon: "▧" },
    { id: "seo", label: "SEO Center", icon: "⌕" },
    { id: "settings", label: "Site controls", icon: "⚙" },
  ];

  if (loading) return <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">Newsroom workspace লোড হচ্ছে…</main>;
  if (!userId || !profile) return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12 text-slate-900">
      <form onSubmit={signIn} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <Link href="/" className="text-sm font-bold text-blue-700">← The World Desk</Link>
        <div className="mt-8 grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-xl font-black text-white">W</div>
        <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-blue-700">The World Desk · Newsroom</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Admin workspace</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">নিউজ, অনুবাদ ও SEO পরিচালনার জন্য অনুমোদিত newsroom account দিয়ে সাইন ইন করো।</p>
        {message && <p role="status" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-900">{message}</p>}
        <label className="mt-6 block text-sm font-bold">Email<input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass}/></label>
        <label className="mt-4 block text-sm font-bold">Password<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass}/></label>
        <button disabled={busy} className={buttonClass + " mt-6 w-full"}>{busy ? "Signing in…" : "Sign in securely"}</button>
        <p className="mt-4 text-xs leading-5 text-slate-400">Public sign-up বন্ধ। Access Supabase-এর editor_profiles permission দিয়ে নিয়ন্ত্রিত।</p>
      </form>
    </main>
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 font-black text-white">W</div><div><p className="font-black tracking-tight">THE WORLD DESK</p><p className="text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">Newsroom CMS</p></div></div>
          <div className="flex items-center gap-3"><span className="hidden text-right sm:block"><span className="block text-sm font-bold">{profile.display_name || email}</span><span className="text-xs capitalize text-slate-500">{profile.role}</span></span><Link href="/" className="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold sm:block">View site ↗</Link><button onClick={signOut} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold">Sign out</button></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white p-4 lg:min-h-[calc(100vh-65px)] lg:border-b-0 lg:border-r lg:p-5">
          <p className="mb-3 px-3 text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Workspace</p>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {nav.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={"flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition " + (tab === item.id ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100")}><span className="text-lg">{item.icon}</span><span className="flex-1">{item.label}</span>{item.hint && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">{item.hint}</span>}</button>)}
          </nav>
          <div className="mt-6 hidden rounded-2xl bg-blue-50 p-4 lg:block"><p className="text-sm font-black text-blue-950">Editorial checklist</p><p className="mt-2 text-xs leading-5 text-blue-800">শিরোনাম, উৎস, ছবি, অনুবাদ ও SEO তথ্য প্রকাশের আগে যাচাই করো।</p><button onClick={() => setTab("seo")} className="mt-3 text-xs font-black text-blue-900 underline">Open SEO Center →</button></div>
          <div className="mt-4 hidden border-t border-slate-100 pt-4 lg:block"><Link href="/admin/analytics" className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100">Analytics & Ads <span>↗</span></Link><a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100">Search Console <span>↗</span></a></div>
        </aside>
        <section className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">The World Desk / {nav.find((item) => item.id === tab)?.label}</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{tab === "dashboard" ? "Newsroom overview" : nav.find((item) => item.id === tab)?.label}</h1><p className="mt-2 text-sm text-slate-500">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div><button onClick={() => { if (userId) void loadEditor(userId); }} disabled={busy} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm disabled:opacity-50">↻ Refresh data</button></div>
          {message && <div role="status" className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950"><span>{message}</span><button aria-label="Dismiss message" onClick={() => setMessage("")} className="font-black">×</button></div>}

          {tab === "dashboard" && <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[{label:"Total articles",value:articles.length,sub:"All newsroom stories",icon:"▤"},{label:"Published",value:published.length,sub:"Live English stories",icon:"↗"},{label:"Drafts",value:drafts.length,sub:"Not published",icon:"✎"},{label:"Needs review",value:reviewTranslations.length,sub:"Translations awaiting review",icon:"◷"}].map((item) => <div key={item.label} className={cardClass}><div className="flex items-start justify-between"><p className="text-sm font-bold text-slate-500">{item.label}</p><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-lg">{item.icon}</span></div><p className="mt-4 text-3xl font-black">{item.value.toLocaleString()}</p><p className="mt-1 text-xs text-slate-400">{item.sub}</p></div>)}
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
              <div className={cardClass}><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black">Recent articles</h2><p className="mt-1 text-sm text-slate-500">সর্বশেষ তৈরি বা সম্পাদিত খবর</p></div><button onClick={() => setTab("articles")} className="text-sm font-bold text-blue-700">View all →</button></div>
                <div className="mt-4 divide-y divide-slate-100">{articles.slice(0,6).map((a) => <div key={a.id} className="flex items-center gap-3 py-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">{a.category.slice(0,2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{a.title}</p><p className="mt-1 truncate text-xs text-slate-400">{a.category} · {a.slug}</p></div><span className={"rounded-full px-2.5 py-1 text-[10px] font-black uppercase " + (a.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{a.status}</span></div>)}{!articles.length && <p className="py-8 text-center text-sm text-slate-400">এখনো কোনো খবর নেই। প্রথম খবরটি লিখে শুরু করো।</p>}</div>
              </div>
              <div className="space-y-4">
                <div className={cardClass}><h2 className="text-lg font-black">Quick actions</h2><div className="mt-4 grid gap-2"><button onClick={() => { resetEditor(); }} className={buttonClass + " text-left"}>＋ Write a new article</button><button onClick={() => setTab("articles")} className="rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-bold hover:bg-slate-50">▤ Manage all articles</button><button onClick={() => setTab("translations")} className="rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-bold hover:bg-slate-50">文 Review translations {reviewTranslations.length > 0 && <span className="ml-1 text-rose-600">({reviewTranslations.length})</span>}</button><button onClick={() => setTab("seo")} className="rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-bold hover:bg-slate-50">⌕ Run SEO checklist</button></div></div>
                <div className={cardClass}><h2 className="text-lg font-black">Content health</h2><div className="mt-4 flex items-center justify-between"><span className="text-sm text-slate-500">Published stories with SEO gaps</span><span className={"text-lg font-black " + (seoIssues.length ? "text-amber-600" : "text-emerald-600")}>{seoIssues.length}</span></div><p className="mt-2 text-xs leading-5 text-slate-400">Missing summary, featured image or URL slug. This is a basic content check, not a Google indexing result.</p><button onClick={() => setTab("seo")} className="mt-3 text-sm font-bold text-blue-700">Review SEO →</button></div>
              </div>
            </div>
          </>}

          {tab === "articles" && <div className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">Article library</h2><p className="mt-1 text-sm text-slate-500">{filteredArticles.length} stories match your filters</p></div><button onClick={() => resetEditor()} className={buttonClass}>＋ New article</button></div>
            <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_170px_190px]"><input aria-label="Search articles" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search headline, slug, author…" className={inputClass + " mt-0"}/><select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass + " mt-0"}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="scheduled">Scheduled</option></select><select aria-label="Filter by category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={inputClass + " mt-0"}><option value="all">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400"><th className="px-3 py-3">Article</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Created</th><th className="px-3 py-3 text-right">Actions</th></tr></thead><tbody>{filteredArticles.map((a) => <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50"><td className="max-w-[360px] px-3 py-4"><p className="truncate text-sm font-bold">{a.title}</p><p className="mt-1 truncate text-xs text-slate-400">/{a.slug}</p></td><td className="px-3 py-4 text-sm">{a.category}</td><td className="px-3 py-4"><span className={"rounded-full px-2.5 py-1 text-[10px] font-black uppercase " + (a.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{a.scheduled_at && a.status === "draft" ? "scheduled" : a.status}</span></td><td className="px-3 py-4 text-xs text-slate-500">{new Date(a.created_at).toLocaleDateString()}</td><td className="px-3 py-4"><div className="flex justify-end gap-2"><button onClick={() => void startEditing(a)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold">Edit</button><button disabled={busy} onClick={() => void changePublishState(a)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-50">{a.status === "published" ? "Unpublish" : "Publish"}</button></div></td></tr>)}</tbody></table>{!filteredArticles.length && <p className="py-10 text-center text-sm text-slate-400">এই ফিল্টারে কোনো খবর পাওয়া যায়নি।</p>}</div>
            <div className="mt-5 border-t border-slate-100 pt-5"><h3 className="font-black">Revision history</h3><p className="mt-1 text-xs text-slate-400">Article edit হলে আগের English article snapshot এখানে জমা হবে।</p><select value={revisionArticleId || ""} onChange={(e) => setRevisionArticleId(e.target.value || null)} className={inputClass}><option value="">Choose an article</option>{articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select>{revisionArticleId && <div className="mt-3 space-y-2">{revisionRows.filter((r) => r.article_id === revisionArticleId).map((r) => <details key={r.id} className="rounded-xl border border-slate-200 p-3"><summary className="cursor-pointer text-sm font-bold">{new Date(r.changed_at).toLocaleString()} · Previous version</summary>{profile.role === "admin" && <button type="button" disabled={busy} onClick={() => void restoreRevision(r)} className="mt-3 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-50">Restore this revision</button>}<pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-xs">{JSON.stringify(r.snapshot, null, 2)}</pre></details>)}{!revisionRows.some((r) => r.article_id === revisionArticleId) && <p className="text-sm text-slate-400">এই article-এর জন্য এখনো revision নেই। পরবর্তী পরিবর্তনের আগে থেকে পুরোনো version তৈরি হবে না।</p>}</div>}</div>
          </div>}

          {tab === "write" && <form onSubmit={saveArticle} className="space-y-5">
            <div className={cardClass}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">{editingId ? "Edit article" : "Create bilingual article"}</h2><p className="mt-1 text-sm text-slate-500">একই Article ID-এর সঙ্গে ইংরেজি ও বাংলা সংস্করণ যুক্ত থাকবে।</p></div>{editingId && <button type="button" onClick={resetEditor} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold">Cancel edit</button>}</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-bold">URL slug *<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="global-economy-update" className={inputClass}/></label><label className="text-sm font-bold">Category<select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label></div>
            </div>
            <div className={cardClass}><div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 font-black text-blue-700">EN</span><div><h2 className="font-black">English version</h2><p className="text-xs text-slate-400">Primary article and canonical slug</p></div></div>
              <label className="block text-sm font-bold">Headline *<input required value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} className={inputClass}/></label>
              <label className="mt-4 block text-sm font-bold">Short summary<textarea rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className={inputClass}/></label>
              <label className="mt-4 block text-sm font-bold">Story body *<textarea required rows={10} value={content} onChange={(e) => setContent(e.target.value)} className={inputClass}/></label>
            </div>
            <div className={cardClass}><div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 font-black text-emerald-700">বাং</span><div><h2 className="font-black">বাংলা সংস্করণ</h2><p className="text-xs text-slate-400">প্রকাশের আগে অনুবাদ যাচাই করো</p></div></div>
              <label className="block text-sm font-bold">বাংলা শিরোনাম *<input required value={bnTitle} onChange={(e) => setBnTitle(e.target.value)} className={inputClass}/></label>
              <label className="mt-4 block text-sm font-bold">সংক্ষিপ্ত বিবরণ<textarea rows={3} value={bnExcerpt} onChange={(e) => setBnExcerpt(e.target.value)} className={inputClass}/></label>
              <label className="mt-4 block text-sm font-bold">সংবাদের বিবরণ *<textarea required rows={10} value={bnContent} onChange={(e) => setBnContent(e.target.value)} className={inputClass}/></label>
            </div>
            <div className={cardClass}><h2 className="font-black">Publishing & media</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-sm font-bold">Featured image URL<input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" className={inputClass}/></label><label className="text-sm font-bold">Byline<input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass}/></label></div>{imageUrl && <div className="mt-4 flex items-center gap-4 rounded-xl bg-slate-50 p-3"><img src={imageUrl} alt="Featured image preview" className="h-20 w-28 rounded-lg object-cover" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}/><p className="text-xs text-slate-500">Featured image preview</p></div>}
              <label className="mt-4 block text-sm font-bold">Action<select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published" | "scheduled")} className={inputClass}><option value="draft">Save as draft</option><option value="scheduled">Schedule publishing</option><option value="published">Publish both languages now</option></select></label>{status === "scheduled" && <label className="mt-4 block text-sm font-bold">Publish date & time<input type="datetime-local" required min={new Date(Date.now() + 60000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16)} value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className={inputClass}/><span className="mt-1 block text-xs font-normal text-slate-400">Uses the browser’s local timezone. Supabase database scheduler checks due stories every minute.</span></label>}
              <div className="mt-5 flex flex-wrap gap-3"><button disabled={busy} className={buttonClass}>{busy ? "Saving…" : status === "published" ? "Publish bilingual article" : status === "scheduled" ? "Schedule article" : "Save draft"}</button><button type="button" disabled={busy || !editingId} onClick={() => editingId && void autoTranslateArticle(editingId)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold disabled:opacity-50">Auto-translate other languages</button></div>
            </div>
          </form>}

          {tab === "translations" && <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.9fr)]">
            <div className={cardClass}><h2 className="text-xl font-black">Translation workflow</h2><p className="mt-1 text-sm text-slate-500">Draft → Review → Published. Machine translation সবসময় মানুষ দিয়ে যাচাই করাও।</p><div className="mt-5 space-y-3">{translations.slice(0,50).map((t) => { const source = articles.find((a) => a.id === t.article_id); return <div key={t.article_id + t.language_code} className="rounded-xl border border-slate-100 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-bold">{t.title || source?.title || "Untitled translation"}</p><p className="mt-1 text-xs text-slate-400">{LOCALE_LABELS[t.language_code as keyof typeof LOCALE_LABELS] || t.language_code} · Source: {source?.title || "Article not loaded"}</p></div><span className={"rounded-full px-2.5 py-1 text-[10px] font-black uppercase " + (t.translation_status === "published" ? "bg-emerald-50 text-emerald-700" : t.translation_status === "review" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700")}>{t.translation_status}</span></div><button onClick={() => { setTranslationArticleId(t.article_id); setTranslationLanguage(t.language_code); setTranslationTitle(t.title || ""); setTranslationExcerpt(t.excerpt || ""); setTranslationContent(t.content || ""); setTranslationStatus(t.translation_status === "published" ? "published" : t.translation_status === "review" ? "review" : "draft"); }} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold">Open translation</button></div>; })}{!translations.length && <p className="py-8 text-sm text-slate-400">এখনো অনুবাদ নেই। ডান পাশের ফর্ম থেকে অনুবাদ তৈরি করো।</p>}</div></div>
            <form onSubmit={saveTranslation} className={cardClass}><h2 className="text-xl font-black">Edit translation</h2><label className="mt-4 block text-sm font-bold">Source article<select required value={translationArticleId} onChange={(e) => { setTranslationArticleId(e.target.value); const t = translations.find((item) => item.article_id === e.target.value && item.language_code === translationLanguage); setTranslationTitle(t?.title || ""); setTranslationExcerpt(t?.excerpt || ""); setTranslationContent(t?.content || ""); setTranslationStatus(t?.translation_status === "published" ? "published" : t?.translation_status === "review" ? "review" : "draft"); }} className={inputClass}><option value="">Choose article</option>{articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select></label>
              <label className="mt-4 block text-sm font-bold">Target language<select value={translationLanguage} onChange={(e) => { const lang = e.target.value; setTranslationLanguage(lang); const t = translations.find((item) => item.article_id === translationArticleId && item.language_code === lang); setTranslationTitle(t?.title || ""); setTranslationExcerpt(t?.excerpt || ""); setTranslationContent(t?.content || ""); setTranslationStatus(t?.translation_status === "published" ? "published" : t?.translation_status === "review" ? "review" : "draft"); }} className={inputClass}>{SUPPORTED_LOCALES.filter((c) => c !== "en").map((c) => <option key={c} value={c}>{LOCALE_LABELS[c]} ({c})</option>)}</select></label>
              <label className="mt-4 block text-sm font-bold">Translated headline *<input required value={translationTitle} onChange={(e) => setTranslationTitle(e.target.value)} className={inputClass}/></label><label className="mt-4 block text-sm font-bold">Summary<textarea rows={3} value={translationExcerpt} onChange={(e) => setTranslationExcerpt(e.target.value)} className={inputClass}/></label><label className="mt-4 block text-sm font-bold">Story body *<textarea required rows={9} value={translationContent} onChange={(e) => setTranslationContent(e.target.value)} className={inputClass}/></label>
              <label className="mt-4 block text-sm font-bold">Workflow status<select value={translationStatus} onChange={(e) => setTranslationStatus(e.target.value as "draft" | "review" | "published")} className={inputClass}><option value="draft">Draft — private</option><option value="review">Needs review</option><option value="published">Publish translation</option></select></label><button disabled={busy || !translationArticleId} className={buttonClass + " mt-5"}>{busy ? "Saving…" : "Save translation"}</button>
            </form>
          </div>}

          {tab === "sections" && <div className={cardClass}><h2 className="text-xl font-black">Categories & homepage coverage</h2><p className="mt-1 text-sm leading-6 text-slate-500">টপ মেনু ছোট রাখা হয়েছে, কিন্তু সব editorial বিভাগ রাখা আছে। এই ভিউ বিভাগভিত্তিক কনটেন্ট দেখায়; বিভাগ বা homepage layout পরিবর্তনের স্থায়ী সেটিংস বর্তমানে database schema-তে নেই।</p><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{CATEGORIES.map((c) => { const items = articles.filter((a) => a.category.toLowerCase() === c.toLowerCase()); return <button key={c} onClick={() => { setCategoryFilter(c); setStatusFilter("all"); setQuery(""); setTab("articles"); }} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"><div><p className="font-bold">{c}</p><p className="mt-1 text-xs text-slate-400">{items.filter((a) => a.status === "published").length} published · {items.filter((a) => a.status !== "published").length} drafts</p></div><span className="grid h-9 min-w-9 place-items-center rounded-full bg-slate-100 px-2 text-sm font-black">{items.length}</span></button>; })}</div><p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">Homepage section order, featured pinning এবং breaking-news banner-এর persistent controls চালু করতে আলাদা site-settings schema ও frontend integration দরকার। এখনো ওই সেটিংস সংরক্ষণের ভান করা হচ্ছে না।</p></div>}

          {tab === "settings" && <div className="space-y-5">
            <form onSubmit={saveSiteSettings} className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">Homepage controls</h2><p className="mt-1 text-sm text-slate-500">Breaking-news banner, featured story selection এবং homepage section order সংরক্ষণ করো।</p></div><span className={"rounded-full px-3 py-1 text-xs font-black " + (profile.role === "admin" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{profile.role === "admin" ? "Admin access" : "Read only"}</span></div>
              <label className="mt-5 flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={breakingEnabled} onChange={(e) => setBreakingEnabled(e.target.checked)} disabled={profile.role !== "admin"} className="h-4 w-4"/> Breaking-news banner enabled</label>
              <div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-sm font-bold">Breaking news (English)<input value={breakingEn} onChange={(e) => setBreakingEn(e.target.value)} disabled={profile.role !== "admin"} className={inputClass}/></label><label className="text-sm font-bold">ব্রেকিং নিউজ (বাংলা)<input value={breakingBn} onChange={(e) => setBreakingBn(e.target.value)} disabled={profile.role !== "admin"} className={inputClass}/></label></div>
              <label className="mt-4 block text-sm font-bold">Featured stories (select multiple)<select multiple value={featuredIds} onChange={(e) => setFeaturedIds(Array.from(e.target.selectedOptions, (o) => o.value))} disabled={profile.role !== "admin"} className={inputClass + " min-h-36"}>{published.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-400">Ctrl/Command ধরে একাধিক story বেছে নাও।</span></label>
              <div className="mt-4"><p className="text-sm font-bold">Homepage section order</p><p className="mt-1 text-xs text-slate-400">একটি section বেছে নিয়ে Move up/down দিয়ে সাজাও।</p><div className="mt-3 space-y-2">{sectionOrder.map((section, index) => <div key={section} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"><span className="text-sm font-bold">{index + 1}. {section}</span><span className="flex gap-2"><button type="button" disabled={profile.role !== "admin" || index === 0} onClick={() => setSectionOrder((old) => { const next = [...old]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })} className="rounded border px-2 py-1 text-xs disabled:opacity-30">↑</button><button type="button" disabled={profile.role !== "admin" || index === sectionOrder.length - 1} onClick={() => setSectionOrder((old) => { const next = [...old]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })} className="rounded border px-2 py-1 text-xs disabled:opacity-30">↓</button></span></div>)}</div></div>
              <button disabled={busy || profile.role !== "admin"} className={buttonClass + " mt-5"}>{busy ? "Saving…" : "Save homepage settings"}</button>
              <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">এই controls homepage integration-এর সঙ্গে যুক্ত। Breaking news, featured story ও section order public homepage-এ প্রয়োগ হবে।</p>
            </form>
            <div className={cardClass}><h2 className="text-xl font-black">Media library</h2><p className="mt-1 text-sm text-slate-500">Image upload (max 10 MB). আপলোড করা ছবির URL article editor-এ বসে যাবে।</p><label className="mt-4 block text-sm font-bold">Upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" disabled={busy} onChange={(e) => { void uploadMedia(e.target.files?.[0] || null); e.currentTarget.value = ""; }} className={inputClass}/></label>{mediaItems.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{mediaItems.map((item) => <div key={item.url} className="overflow-hidden rounded-xl border border-slate-200"><button type="button" onClick={() => { setImageUrl(item.url); setTab("write"); setMessage("ছবির URL editor-এ বসানো হয়েছে।"); }} className="block w-full text-left"><img src={item.url} alt="" className="h-36 w-full object-cover"/><p className="truncate p-3 text-xs font-bold">{item.name}</p></button>{profile.role === "admin" && <button type="button" disabled={busy} onClick={() => void deleteMedia(item)} className="m-3 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50">Delete media</button>}</div>)}</div>}<p className="mt-3 text-xs text-slate-400">এই account-এর newsroom-media folder থেকে media browse করা হয়। Admin পুরোনো ফাইল delete করতে পারেন; যেসব article-এ ফাইলটি ব্যবহৃত, সেগুলো আগে যাচাই করো।</p></div>
            {profile.role === "admin" && <div className={cardClass}><h2 className="text-xl font-black">Newsroom user management</h2><p className="mt-1 text-sm text-slate-500">Supabase Auth-এ আগে থেকে থাকা user-এর UUID দিয়ে Admin/Editor access assign করো। Public sign-up খোলা হয় না।</p><form onSubmit={manageEditorProfile} className="mt-4 grid gap-3 md:grid-cols-3"><label className="text-sm font-bold md:col-span-3">Auth user UUID<input required value={profileUserId} onChange={(e) => setProfileUserId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className={inputClass}/></label><label className="text-sm font-bold">Display name<input value={profileDisplayName} onChange={(e) => setProfileDisplayName(e.target.value)} className={inputClass}/></label><label className="text-sm font-bold">Role<select value={profileRole} onChange={(e) => setProfileRole(e.target.value as "admin" | "editor")} className={inputClass}><option value="editor">Editor</option><option value="admin">Admin</option></select></label><button disabled={busy} className={buttonClass + " self-end"}>Save user role</button></form><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-400"><th className="py-3 pr-3">Display name</th><th className="py-3 pr-3">User UUID</th><th className="py-3">Role</th></tr></thead><tbody>{editorProfiles.map((ep) => <tr key={ep.user_id} className="border-b border-slate-100"><td className="py-3 pr-3">{ep.display_name || "—"}</td><td className="py-3 pr-3 font-mono text-xs">{ep.user_id}</td><td className="py-3 capitalize">{ep.role}</td></tr>)}</tbody></table></div></div>}
          </div>}

          {tab === "seo" && <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[{label:"Published articles",value:published.length,desc:"SEO audit target"},{label:"Missing summaries",value:published.filter((a) => !a.excerpt?.trim()).length,desc:"Add a useful meta description / excerpt"},{label:"Missing featured image",value:published.filter((a) => !a.image_url?.trim()).length,desc:"Add a shareable image"}].map((item) => <div key={item.label} className={cardClass}><p className="text-sm font-bold text-slate-500">{item.label}</p><p className="mt-3 text-3xl font-black">{item.value}</p><p className="mt-2 text-xs text-slate-400">{item.desc}</p></div>)}</div>
            <div className={cardClass}><h2 className="text-xl font-black">SEO checklist</h2><p className="mt-1 text-sm text-slate-500">এগুলো basic content checks—Google indexing বা ranking-এর নিশ্চয়তা নয়।</p><div className="mt-4 divide-y divide-slate-100">{[{label:"Published article has URL slug",count:published.filter((a) => !a.slug?.trim()).length},{label:"Published article has summary",count:published.filter((a) => !a.excerpt?.trim()).length},{label:"Published article has featured image",count:published.filter((a) => !a.image_url?.trim()).length},{label:"Bengali translation published",count:published.filter((a) => !translations.some((t) => t.article_id === a.id && t.language_code === "bn" && t.translation_status === "published")).length}].map((item) => <div key={item.label} className="flex items-center justify-between gap-4 py-4"><span className="text-sm font-bold">{item.label}</span><span className={"rounded-full px-3 py-1 text-xs font-black " + (item.count ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>{item.count ? item.count + " need attention" : "Looks good"}</span></div>)}</div><div className="mt-5 flex flex-wrap gap-3"><a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className={buttonClass}>Open Google Search Console ↗</a><a href="/sitemap.xml" target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold">View sitemap ↗</a><a href="/news-sitemap.xml" target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold">News sitemap ↗</a></div></div>
          </div>}
        </section>
      </div>
    </main>
  );
}
