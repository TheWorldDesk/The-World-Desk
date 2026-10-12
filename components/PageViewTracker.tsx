"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function PageViewTracker() {
  useEffect(() => {
    if (!supabase) return;
    const path = window.location.pathname;
    if (path.startsWith("/admin")) return;
    let visitorId = "";
    try {
      visitorId = localStorage.getItem("twd_visitor_id") || "";
      if (!visitorId) {
        visitorId = typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem("twd_visitor_id", visitorId);
      }
    } catch {
      visitorId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    void supabase.from("site_page_views").insert({
      path: path.slice(0, 500),
      visitor_id: visitorId,
      referrer: document.referrer ? document.referrer.slice(0, 1000) : null,
    });
  }, []);
  return null;
}
