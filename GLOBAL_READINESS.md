# The World Desk — Global Readiness Roadmap

## Implemented
- Locale registry for 30 major languages in `lib/i18n.ts`.
- Browser `Accept-Language` negotiation helper with quality-weighted preferences.
- Supabase `article_translations` table with per-language content and draft/review/published states.
- Row-level security: public readers can read only published translations for published articles; editor/admin profiles can manage translations.
- Article navigation now points to global regions instead of a Bangladesh-specific section.

## Required before production multilingual launch
1. **Locale routing:** implement locale-prefixed routes such as `/en/`, `/bn/`, `/ar/` and keep each page's URL stable. Do not serve different languages at the same URL based only on headers.
2. **UI dictionaries:** translate navigation, search, labels, date formatting, footer, forms, errors, metadata and admin-facing public copy.
3. **Article content:** read the correct `article_translations` row for the requested locale; never claim a translation exists when it does not. Provide an explicit fallback and label machine-translated copy.
4. **Translation provider:** select and configure a translation service. Put credentials only in server-side Vercel environment variables (for example `GOOGLE_CLOUD_TRANSLATE_API_KEY`); never use `NEXT_PUBLIC_` for secrets. No provider credential is stored in this repository.
5. **Editorial workflow:** new translations begin as drafts/review; only reviewed or approved translations become publicly published, according to editorial policy.
6. **SEO:** locale-specific metadata, canonical URLs, reciprocal `hreflang`, sitemap entries for real translated URLs, Open Graph locale, and correct `lang`/RTL direction.
7. **News quality:** use verified sources, clear bylines, publication/update timestamps, corrections policy, and distinguish illustrative/demo content from real reporting.
8. **Security and privacy:** protect editor/admin routes, keep RLS enabled, avoid exposing secrets, add rate limits to translation endpoints, publish privacy/cookie/contact/editorial policies, and minimize personal data.
9. **Accessibility and reliability:** keyboard-accessible navigation, semantic landmarks, alt text, contrast, responsive/mobile checks, error/loading states, caching, backups, monitoring and uptime alerts.
10. **Validation:** run lint/typecheck/build, test each locale route, test RTL languages, verify sitemap and structured metadata, and confirm Vercel production deployment is Ready before announcing launch.

## Current status
This is a preparation checklist, not a claim that all items are implemented. Locale routing, actual translations, translation-provider configuration, and production verification remain necessary. The Vercel deployment could not be verified from the current connected account permissions.
