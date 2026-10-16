"use client";

import { useState } from "react";

export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this article link:", url);
    }
  }
  async function shareNative() {
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* User cancelled the share sheet. */ }
    } else {
      await copyLink();
    }
  }
  return (
    <div className="my-5 flex flex-wrap items-center gap-2" aria-label="Share this story">
      <span className="mr-1 text-sm font-bold text-neutral-600">Share:</span>
      <button type="button" onClick={() => void shareNative()} className="rounded-full border border-neutral-300 px-3 py-2 text-xs font-bold hover:bg-neutral-100">Share / Copy</button>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-neutral-300 px-3 py-2 text-xs font-bold hover:bg-neutral-100">Facebook</a>
      <a href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-neutral-300 px-3 py-2 text-xs font-bold hover:bg-neutral-100">X</a>
      <a href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-neutral-300 px-3 py-2 text-xs font-bold hover:bg-neutral-100">WhatsApp</a>
      <button type="button" onClick={() => void copyLink()} className="rounded-full border border-neutral-300 px-3 py-2 text-xs font-bold hover:bg-neutral-100">{copied ? "Link copied ✓" : "Copy link"}</button>
    </div>
  );
}
