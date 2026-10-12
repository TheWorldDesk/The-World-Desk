create table if not exists public.article_translations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  language_code text not null,
  title text not null,
  excerpt text,
  content text not null,
  category text,
  translation_status text not null default 'draft'
    check (translation_status in ('draft', 'review', 'published')),
  translated_by text not null default 'machine',
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, language_code),
  check (language_code ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$')
);

create index if not exists article_translations_language_status_idx
  on public.article_translations (language_code, translation_status);

alter table public.article_translations enable row level security;

grant select on public.article_translations to anon, authenticated;
grant insert, update, delete on public.article_translations to authenticated;

drop policy if exists "Public can read published article translations" on public.article_translations;
create policy "Public can read published article translations"
  on public.article_translations for select to anon, authenticated
  using (
    translation_status = 'published'
    and exists (
      select 1 from public.articles a
      where a.id = article_translations.article_id
        and a.status = 'published'
    )
  );

drop policy if exists "Editors can manage article translations" on public.article_translations;
create policy "Editors can manage article translations"
  on public.article_translations for all to authenticated
  using (
    exists (
      select 1 from public.editor_profiles ep
      where ep.user_id = (select auth.uid())
        and ep.role in ('admin', 'editor')
    )
  )
  with check (
    exists (
      select 1 from public.editor_profiles ep
      where ep.user_id = (select auth.uid())
        and ep.role in ('admin', 'editor')
    )
  );
