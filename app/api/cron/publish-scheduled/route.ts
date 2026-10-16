import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Scheduled publishing is not configured" }, { status: 503 });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const now = new Date().toISOString();
  const { data: due, error: selectError } = await supabase
    .from("articles")
    .select("id")
    .eq("status", "draft")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now)
    .limit(100);

  if (selectError) return NextResponse.json({ error: selectError.message }, { status: 500 });
  if (!due?.length) return NextResponse.json({ published: 0 });

  let published = 0;
  const failures: string[] = [];
  for (const article of due) {
    const { error: articleError } = await supabase
      .from("articles")
      .update({ status: "published", published_at: now, scheduled_at: null })
      .eq("id", article.id)
      .eq("status", "draft");
    if (articleError) {
      failures.push(`${article.id}: article update failed`);
      continue;
    }
    const { error: translationError } = await supabase
      .from("article_translations")
      .update({ translation_status: "published", updated_at: now })
      .eq("article_id", article.id)
      .eq("language_code", "bn")
      .eq("translation_status", "draft");
    if (translationError) {
      // Keep the English story live, but report the translation failure for follow-up.
      failures.push(`${article.id}: translation update failed`);
    }
    published += 1;
  }

  return NextResponse.json({ published, failures }, { status: failures.length ? 207 : 200 });
}
