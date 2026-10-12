"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type AdSettings = {
  ads_enabled: boolean;
  adsense_publisher_id: string;
  adsense_client_code: string;
  show_homepage: boolean;
  show_article_top: boolean;
  show_article_inline: boolean;
};

export default function AnalyticsAdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [range, setRange] = useState(7);
  const [views, setViews] = useState(0);
  const [visitors, setVisitors] = useState(0);
  const [topPages, setTopPages] = useState<{path:string;count:number}[]>([]);
  const [settings, setSettings] = useState<AdSettings>({
    ads_enabled:false, adsense_publisher_id:"", adsense_client_code:"",
    show_homepage:true, show_article_top:true, show_article_inline:true
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadAnalytics(days:number) {
    if (!supabase) return;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data, error } = await supabase.from("site_page_views")
      .select("path,visitor_id,created_at").gte("created_at", since).limit(10000);
    if (error) { setMessage("Analytics load failed: " + error.message); return; }
    const rows = data ?? [];
    setViews(rows.length);
    setVisitors(new Set(rows.map((r) => r.visitor_id)).size);
    const counts = new Map<string,number>();
    rows.forEach((r) => counts.set(r.path, (counts.get(r.path) || 0) + 1));
    setTopPages([...counts.entries()].map(([path,count])=>({path,count})).sort((a,b)=>b.count-a.count).slice(0,10));
  }

  useEffect(() => {
    let active = true;
    async function init() {
      if (!supabase) { setMessage("Supabase configuration missing."); setLoading(false); return; }
      const {data:{session}} = await supabase.auth.getSession();
      if (!session?.user) { if(active) { setMessage("আগে মূল Admin প্যানেলে লগইন করো।"); setLoading(false); } return; }
      const {data:profile} = await supabase.from("editor_profiles").select("role").eq("user_id",session.user.id).maybeSingle();
      if (!active) return;
      if (profile?.role !== "admin") { setMessage("এই পেজ শুধু Admin ব্যবহার করতে পারবেন।"); setLoading(false); return; }
      setAuthorized(true);
      const {data:ad} = await supabase.from("site_ad_settings").select("*").eq("id",1).maybeSingle();
      if (ad) setSettings({
        ads_enabled:ad.ads_enabled, adsense_publisher_id:ad.adsense_publisher_id || "",
        adsense_client_code:ad.adsense_client_code || "", show_homepage:ad.show_homepage,
        show_article_top:ad.show_article_top, show_article_inline:ad.show_article_inline
      });
      await loadAnalytics(7);
      setLoading(false);
    }
    void init();
    return () => { active=false; };
  }, []);

  async function save(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !authorized) return;
    setSaving(true); setMessage("");
    const {error} = await supabase.from("site_ad_settings").update({...settings,updated_at:new Date().toISOString()}).eq("id",1);
    setMessage(error ? "Save failed: " + error.message : "সেটিংস সংরক্ষণ হয়েছে।");
    setSaving(false);
  }

  const card: React.CSSProperties = {border:"1px solid #ddd",borderRadius:12,padding:16,background:"white",color:"#17202a"};
  const field: React.CSSProperties = {display:"block",width:"100%",padding:10,border:"1px solid #bbb",borderRadius:8,marginTop:6,marginBottom:14};
  if (loading) return <main style={{padding:24}}>লোড হচ্ছে…</main>;
  return <main style={{maxWidth:1000,margin:"0 auto",padding:20,color:"inherit"}}>
    <p><Link href="/admin">← মূল Admin প্যানেলে ফিরে যাও</Link></p>
    <h1 style={{fontSize:30,fontWeight:800,marginBottom:6}}>Analytics & Monetization</h1>
    <p>ভিজিটর রিপোর্ট ও বিজ্ঞাপনের সেটিংস</p>
    {message && <p role="status" style={{padding:12,background:"#f4f4f4",borderRadius:8,margin:"12px 0"}}>{message}</p>}
    {authorized && <>
      <section style={{display:"flex",gap:12,flexWrap:"wrap",margin:"20px 0"}}>
        <div style={{...card,flex:"1 1 220px"}}><label>রিপোর্টের সময়</label><select style={field} value={range} onChange={e=>{const d=Number(e.target.value);setRange(d);void loadAnalytics(d);}}><option value={1}>আজ / গত ২৪ ঘণ্টা</option><option value={7}>গত ৭ দিন</option><option value={30}>গত ৩০ দিন</option></select></div>
        <div style={{...card,flex:"1 1 180px"}}><p>Page views</p><strong style={{fontSize:32}}>{views.toLocaleString()}</strong></div>
        <div style={{...card,flex:"1 1 180px"}}><p>Unique browser IDs</p><strong style={{fontSize:32}}>{visitors.toLocaleString()}</strong></div>
      </section>
      <section style={{...card,marginBottom:20}}>
        <h2 style={{fontSize:21,fontWeight:750}}>জনপ্রিয় পেজ</h2>
        {topPages.length ? <div style={{overflowX:"auto"}}><table style={{width:"100%",textAlign:"left",borderCollapse:"collapse"}}><thead><tr><th style={{padding:8}}>পেজ</th><th style={{padding:8}}>ভিউ</th></tr></thead><tbody>{topPages.map(p=><tr key={p.path}><td style={{padding:8,borderTop:"1px solid #eee"}}>{p.path}</td><td style={{padding:8,borderTop:"1px solid #eee"}}>{p.count}</td></tr>)}</tbody></table></div> : <p>এখনো কোনো ট্র্যাক করা ভিজিট নেই। ট্র্যাকার চালুর পর থেকে তথ্য জমা হবে।</p>}
      </section>
      <form onSubmit={save} style={card}>
        <h2 style={{fontSize:22,fontWeight:800}}>বিজ্ঞাপন ও মনিটাইজেশন</h2>
        <p>AdSense অনুমোদন ও সঠিক publisher ID ছাড়া বিজ্ঞাপন থেকে আয় শুরু হবে না।</p>
        <label style={{display:"flex",gap:10,alignItems:"center",margin:"16px 0"}}><input type="checkbox" checked={settings.ads_enabled} onChange={e=>setSettings({...settings,ads_enabled:e.target.checked})}/> সাইটে বিজ্ঞাপন দেখানোর সেটিং চালু</label>
        <label>AdSense Publisher ID (যেমন ca-pub-…)</label><input style={field} value={settings.adsense_publisher_id} onChange={e=>setSettings({...settings,adsense_publisher_id:e.target.value})} placeholder="ca-pub-xxxxxxxxxxxxxxxx"/>
        <label>AdSense ad code / client snippet</label><textarea style={{...field,minHeight:110,fontFamily:"monospace"}} value={settings.adsense_client_code} onChange={e=>setSettings({...settings,adsense_client_code:e.target.value})} placeholder="AdSense client snippet (কোনো secret key নয়)"/>
        <p style={{fontSize:13}}>নোট: এই প্রথম সংস্করণে বিজ্ঞাপনের সেটিংস সংরক্ষণ হয়; লাইভ সাইটে বিজ্ঞাপন দেখানো ও publisher code যুক্ত করতে আলাদা frontend integration প্রয়োজন।</p>
        {([
          ["show_homepage","হোমপেজে বিজ্ঞাপন দেখানোর অনুমতি"],
          ["show_article_top","নিউজের ওপরে বিজ্ঞাপন দেখানোর অনুমতি"],
          ["show_article_inline","নিউজের লেখার মাঝে বিজ্ঞাপন দেখানোর অনুমতি"]
        ] as const).map(([key,label])=><label key={key} style={{display:"flex",gap:10,alignItems:"center",margin:"12px 0"}}><input type="checkbox" checked={settings[key]} onChange={e=>setSettings({...settings,[key]:e.target.checked})}/>{label}</label>)}
        <button disabled={saving} style={{padding:"11px 18px",borderRadius:8,border:0,background:"#111827",color:"white",fontWeight:700}}>{saving?"সংরক্ষণ হচ্ছে…":"সেটিংস সংরক্ষণ করো"}</button>
      </form>
    </>}
  </main>;
}
