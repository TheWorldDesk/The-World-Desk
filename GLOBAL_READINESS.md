# The World Desk — International Readiness

## Implemented foundations
- Global-first English news pages and regional sections; Bangladesh is not the site's geographic identity.
- Supabase article storage and public-read/editorial-write row-level security.
- A separate `article_translations` table with per-language content and draft/review/published states.
- A 30-language locale registry and browser `Accept-Language` negotiation.
- Locale-prefixed URL handling through middleware. Supported locale prefixes are rewritten internally to the existing page routes, with a persistent locale cookie and language/direction request metadata.
- Root document `lang` and `dir` are set from the requested locale, including RTL direction for Arabic, Persian and Urdu.
- Best-effort Google Translate fallback for browser language. This is a convenience proxy, not reviewed/native localization, and does not guarantee translation quality.
- Dynamic sitemap and robots metadata routes.
- Baseline HTTP security headers and a GitHub Actions build workflow.

## Required before production multilingual launch
1. **UI localization:** existing page copy remains primarily English. Build reviewed locale dictionaries for navigation, search, footer, forms, errors and metadata.
2. **Article translations:** article pages do not yet select `article_translations` based on locale. Add the query and explicit original-language fallback; label machine translations.
3. **Translation service:** no translation provider credentials are configured. Add credentials only as server-side Vercel environment variables, never in Git or `NEXT_PUBLIC_*`.
4. **Editorial workflow:** generated translations should remain draft/review until editorial approval.
5. **SEO:** locale-specific canonical metadata, reciprocal `hreflang`, and sitemap entries only for genuinely available translated pages are still required. Current alternate metadata is only a minimal starter.
6. **News quality:** sample/demo stories are illustrative, not verified current news. Replace with fact-checked reporting before presenting them as live journalism.
7. **Security and privacy:** audit authorization on every editorial write route, retain RLS, rate-limit translation endpoints, and publish privacy/contact/editorial/corrections policies.
8. **Accessibility and operations:** test keyboard navigation, contrast, alt text, mobile layouts, RTL, error states, backups, monitoring and uptime alerts.
9. **Release validation:** run CI, test all routes and confirm Vercel production deployment is Ready before announcing launch.

## Current status
Locale-prefixed URL handling and document language/direction are implemented as foundations. The site is **not yet fully multilingual or production-verified**: most UI remains English, article translation lookup is not wired in, translation provider setup is absent, and live deployment status must be checked.
