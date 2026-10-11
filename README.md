# The-World-Desk

The-World-Desk is a Next.js App Router news portal using Tailwind CSS, Supabase and Vercel.

## Current features

- Responsive front page driven by published Supabase articles (English edition).
- Published article detail pages at `/article/[slug]`.
- Authenticated newsroom sign-in at `/admin`; no public sign-up form.
- Draft and publish workflow, with editor access checked against `public.editor_profiles`.
- Supabase Row Level Security remains the authority for database writes.
- Dynamic `/sitemap.xml` and `/robots.txt`.

## Environment variables

Set these in Vercel for Production, Preview and Development:

- `NEXT_PUBLIC_SUPABASE_URL`: the Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the Supabase publishable key. The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also accepted.
- `NEXT_PUBLIC_SITE_URL`: canonical public origin, for example `https://the-world-desk.vercel.app`.

Never expose or commit a Supabase service-role key. The browser only uses the publishable key; RLS must remain enabled.

## Enable the first editor

1. In Supabase Dashboard, open **Authentication → Users** and create the newsroom owner's user. Keep public sign-up disabled unless there is a deliberate need for it.
2. Copy that user's UUID.
3. Run the following SQL in Supabase SQL Editor, replacing the UUID and display name:

```sql
insert into public.editor_profiles (user_id, display_name, role)
values ('REPLACE-WITH-AUTH-USER-UUID', 'Newsroom Admin', 'admin')
on conflict (user_id) do update
set display_name = excluded.display_name, role = 'admin';
```

4. Sign in at `/admin` using that user's email and password.

Only users with an `editor_profiles` row can use the editorial workspace. Database RLS policies decide which operations are permitted.

## Local development

```bash
npm install
npm run dev
```

## Editorial and localization notes

Only published English articles are currently shown publicly. Bengali article fields exist in the database, but public locale routes, Arabic/Spanish editions, automatic translation, media uploads, and translation review/queue workflows are not yet implemented. Editors should fact-check all copy and verify image usage rights before publishing.
