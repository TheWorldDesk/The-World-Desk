# The World Desk — International Readiness

## Implemented foundations
- Global-first English news pages and regional sections; Bangladesh is not the site's geographic identity.
- Supabase article storage and public-read/editorial-write row-level security.
- A separate `article_translations` table with per-language content and draft/review/published states.
- Locale-prefixed URL handling for configured locales, browser `Accept-Language` negotiation, and a persistent locale cookie.
- Basic search-query script detection for Bengali, Hindi/Devanagari, Tamil, Telugu, Malayalam, Gujarati, Punjabi, Thai, Korean, Japanese, Chinese, Cyrillic, and unaccented Latin queries.
- Root document `lang` and `dir` values set from the selected locale, including RTL direction for Arabic, Persian and Urdu.
- Public article retrieval now selects only `published` translation rows for the requested language and falls back to the original English article if none exists. Article detail pages disclose when no reviewed translation is available.
- Best-effort Google Translate fallback for browser language. This is a convenience proxy, not reviewed/native localization, and does not guarantee translation quality.
- Dynamic sitemap and robots metadata routes; the sitemap includes translated article URLs only when a published translation exists.
- Article pages emit NewsArticle structured data, descriptive hero-image alt text, canonical URLs, and language alternates for published translations.
- Public editorial standards and corrections policy pages linked from the main and article footers.
- GitHub Actions runs explicit TypeScript type checking before the production build; Dependabot proposes weekly dependency updates.
- Baseline HTTP security headers and a GitHub Actions build workflow with TypeScript checks.

## Required before production multilingual launch
1. **UI localization:** most navigation, labels, forms, search messages, footer, and page metadata are still authored in English. Add reviewed dictionaries for each supported locale.
2. **Translation service and content:** no provider credentials are configured and no reviewed translations have been seeded into `article_translations`. Add credentials only as server-side Vercel environment variables, never in Git or `NEXT_PUBLIC_*`.
3. **Editorial workflow:** machine translations should remain draft/review until editorial approval. Verify translation publishing permissions and editorial UI.
4. **SEO:** validate canonical metadata, reciprocal `hreflang`, structured data and translated sitemap output against live pages; only genuinely published translated pages are included.
5. **Language detection limits:** search script detection is heuristic. It cannot reliably distinguish every language that shares a script (for example, Arabic/Persian/Urdu) or every Latin-script language. Browser preferences are the fallback.
6. **News quality:** sample/demo stories are illustrative, not verified current news. Replace them with fact-checked reporting before presenting them as live journalism.
7. **Security and privacy:** audit authorization on every editorial write route, retain RLS, rate-limit translation endpoints, and publish privacy/contact/editorial/corrections policies.
8. **Accessibility and operations:** test keyboard navigation, contrast, alt text, mobile layouts, RTL, error states, backups, monitoring and uptime alerts.
9. **Release validation:** run CI, test all public/admin routes, and confirm the Vercel production deployment is Ready before announcing launch.

## Current status
Locale-prefixed routing, request locale propagation, translation-row retrieval, original-language fallback labels, and basic security headers are implemented in the repository. The site is **not yet fully multilingual or production-verified**: most UI remains English unless the browser translation proxy is used, reviewed article translations/provider setup are absent, and the current Vercel connection cannot inspect the production project because of a team-scope permission error. GitHub Actions type-check and build passed for commit `c56cada5f7304e7c75bc1dd0b7d937d1e5f15767`; later changes are still awaiting their CI run. The Vercel team connection remains blocked by a scope permission error, so live deployment readiness is not confirmed.
