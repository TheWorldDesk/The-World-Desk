import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://the-world-desk.vercel.app";
  const urls: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "hourly", priority: 1 },
  ];

  if (!supabase) return urls;
  const { data, error } = await supabase
    .from("articles")
    .select("slug,published_at,updated_at")
    .eq("status", "published")
    .eq("language", "en")
    .order("published_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("Unable to build article sitemap:", error.message);
    return urls;
  }

  for (const article of data ?? []) {
    urls.push({
      url: `${baseUrl}/article/${article.slug}`,
      lastModified: article.updated_at || article.published_at || new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  return urls;
}
