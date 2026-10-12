import { NextResponse } from "next/server";
import { SUPPORTED_LOCALES, isLocale } from "@/lib/i18n";

export const runtime = "nodejs";

type TranslationRequest = {
  title?: string;
  excerpt?: string;
  content?: string;
  targetLanguage?: string;
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
    const detail = await response.text();
    console.error("Translation provider error:", response.status, detail.slice(0, 500));
    throw new Error("Translation provider request failed");
  }
  const payload = await response.json();
  const translated = payload?.data?.translations?.[0]?.translatedText;
  if (typeof translated !== "string") throw new Error("Translation provider returned no text");
  return translated;
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Automatic translation is not configured. Add GOOGLE_TRANSLATE_API_KEY to the server environment." },
      { status: 503 },
    );
  }

  let body: TranslationRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  const targetLanguage = body.targetLanguage;
  if (!targetLanguage || !isLocale(targetLanguage) || targetLanguage === "en") {
    return NextResponse.json({ error: "Choose a supported non-English target language." }, { status: 400 });
  }

  const fields = [body.title, body.excerpt, body.content].filter((value): value is string => typeof value === "string");
  if (!fields.length || fields.some((value) => value.length > 100000)) {
    return NextResponse.json({ error: "Provide story text, with each field no longer than 100,000 characters." }, { status: 400 });
  }

  try {
    const [title, excerpt, content] = await Promise.all([
      translateText(body.title || "", targetLanguage, apiKey),
      translateText(body.excerpt || "", targetLanguage, apiKey),
      translateText(body.content || "", targetLanguage, apiKey),
    ]);
    return NextResponse.json({
      targetLanguage,
      title,
      excerpt,
      content,
      provider: "Google Cloud Translation",
      supportedLanguages: SUPPORTED_LOCALES.length,
    });
  } catch {
    return NextResponse.json({ error: "Translation failed. Check the translation API configuration and try again." }, { status: 502 });
  }
}
