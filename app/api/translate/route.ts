import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isLocale, SUPPORTED_LOCALES } from "@/lib/i18n";

export const runtime = "nodejs";

type TranslationRequest = {
  articleId?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  targetLanguage?: string;
  save?: boolean;
};

async function translateText(text: string, targetLanguage: string, apiKey: string) {
  if (!text.trim()) return text;
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ q: text, target: targetLanguage, format: "text" }),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    console.error("Translation provider error:", response.status, (await response.text()).slice(0, 500));
    throw new Error("Translation provider request failed");
  }
  const payload = await response.json();
  const translated = payload?.data?.translations?.[0]?.translatedText;
  if (typeof translated !== "string") throw new Error("Translation provider returned no text");
  return translated;
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Automatic translation is not configured. Add GOOGLE_TRANSLATE_API_KEY to the server environment." }, { status: 503 });

  let body: TranslationRequest;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }

  const targetLanguage = body.targetLanguage;
  if (!targetLanguage || !isLocale(targetLanguage) || targetLanguage === "en") {
    return NextResponse.json({ error: "Choose a supported non-English target language." }, { status: 400 });
  }
  const fields = [body.title, body.excerpt, body.content].filter((value): value is string => typeof value === "string");
  const totalCharacters = fields.reduce((total, value) => total + value.length, 0);
  if (!fields.length || totalCharacters > 30000) {
    return NextResponse.json({ error: "Provide story text totaling no more than 30,000 characters." }, { status: 400 });
  }

  // This endpoint uses a paid translation API. Require an approved editor for every
  // request, not only requests that save results, to prevent anonymous cost abuse.
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Sign in with an approved editor account." }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Editor authentication is not configured." }, { status: 503 });
  }

  const client = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Editor authentication failed." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await client
    .from("editor_profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (profileError || !profile || !["admin", "editor"].includes(profile.role)) {
    return NextResponse.json({ error: "Approved editor access required." }, { status: 403 });
  }
  if (body.save && !body.articleId) {
    return NextResponse.json({ error: "Saving a translation requires articleId." }, { status: 400 });
  }

  try {
    const [title, excerpt, content] = await Promise.all([
      translateText(body.title || "", targetLanguage, apiKey),
      translateText(body.excerpt || "", targetLanguage, apiKey),
      translateText(body.content || "", targetLanguage, apiKey),
    ]);

    if (body.save) {
      const { data: article, error: articleError } = await client.from("articles").select("id").eq("id", body.articleId).maybeSingle();
      if (articleError || !article) return NextResponse.json({ error: "Source article not found or access denied." }, { status: 404 });
      const { error: saveError } = await client.from("article_translations").upsert({
        article_id: body.articleId, language_code: targetLanguage, title, excerpt: excerpt || null, content,
        translation_status: "draft", translated_by: "google-cloud-translation", reviewed_by: null, updated_at: new Date().toISOString(),
      }, { onConflict: "article_id,language_code" });
      if (saveError) return NextResponse.json({ error: "Translation was generated but could not be saved. Check translation table permissions and unique constraint." }, { status: 500 });
    }

    return NextResponse.json({ articleId: body.articleId || null, targetLanguage, title, excerpt, content, saved: Boolean(body.save), provider: "Google Cloud Translation", supportedLanguages: SUPPORTED_LOCALES.length });
  } catch {
    return NextResponse.json({ error: "Translation failed. Check the translation API configuration and try again." }, { status: 502 });
  }
}
