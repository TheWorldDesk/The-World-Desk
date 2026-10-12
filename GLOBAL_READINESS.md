# The World Desk — International Readiness

## Foundations present
- Global-first English news pages and regional sections; Bangladesh is not the site's geographic identity.
- Supabase article storage and public-read/editorial-write row-level security.
- A separate `article_translations` table with language code, translated fields, editorial status, and public access limited to published translations of published articles.
- A 30-language locale registry and browser language negotiation helper.
- A browser-language translation fallback using Google Translate. This is a convenience fallback, **not** native localization, does not guarantee translation quality, and is not a substitute for published translations.
- Dynamic sitemap and robots metadata routes.
- Baseline HTTP security headers and a GitHub Actions build workflow.

## Important remaining launch requirements
1. **Native locale routes:** the current application has not yet been migrated to a consistent locale-prefixed route tree such as `/en/`, `/bn/`, and `/ar/`. Do not claim native locale routing is complete.
2. **Translated UI:** all navigation, forms, search, metadata, errors, footer, and article labels need reviewed language dictionaries.
3. **Published article translations:** article pages must query `article_translations` for the selected locale and clearly fall back to the original language when no approved translation exists.
4. **Translation service:** no paid translation provider is configured. Add provider credentials only through server-side deployment environment variables; never commit credentials or expose them through `NEXT_PUBLIC_*`.
5. **Editorial quality:** machine translations should remain draft/review until editorial approval. Keep bylines, source attribution, corrections and timestamps visible.
6. **SEO:** add locale-specific metadata, canonical URLs, reciprocal `hreflang`, translated sitemap URLs only for routes that really exist, Open Graph locale, and correct `lang`/RTL direction.
7. **Demo content:** demo/sample articles are not current verified reporting. Replace them with fact-checked journalism or keep conspicuous demo labels; never present them as live news.
8. **Security and privacy:** verify admin/editor authorization on every write route, keep RLS enabled, rate-limit translation endpoints, and publish privacy, contact, editorial and corrections policies.
9. **Accessibility and operations:** test keyboard access, contrast, image alt text, mobile layouts, Arabic/Urdu/Persian RTL, error states, backups, monitoring and uptime alerts.
10. **Release validation:** run CI and review its build result, test all public/admin routes and verify the Vercel production deployment is Ready before announcing a launch.

## Current status
This document is a truthful checklist, not a claim of complete production readiness. The full native multilingual route migration, reviewed translations, translation-provider configuration, and live Vercel verification are still outstanding. Vercel production status could not be confirmed from the current connected account permissions.
