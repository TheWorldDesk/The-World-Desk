-- The World Desk news database
-- Applied to Supabase project vkuskhuedsibltgwznpt.
-- Public readers may only read published stories. Editorial writes require
-- an authenticated user whose editor_profiles role is editor/admin.

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  title_bn text,
  excerpt text,
  excerpt_bn text,
  content text,
  content_bn text,
  category text not null default 'World',
  image_url text,
  author_name text,
  language text not null default 'en' check (language in ('en','bn')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.editor_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'editor' check (role in ('editor','admin')),
  created_at timestamptz not null default now()
);

create index if not exists articles_status_published_at_idx on public.articles(status, published_at desc);
create index if not exists articles_category_idx on public.articles(category);
create index if not exists articles_language_idx on public.articles(language);

alter table public.articles enable row level security;
alter table public.editor_profiles enable row level security;

grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;
grant select on public.editor_profiles to authenticated;

drop policy if exists "Anyone can read published articles" on public.articles;
create policy "Anyone can read published articles"
on public.articles for select to anon, authenticated
using (status = 'published');

drop policy if exists "Editors can read all articles" on public.articles;
create policy "Editors can read all articles"
on public.articles for select to authenticated
using (exists (select 1 from public.editor_profiles ep where ep.user_id = (select auth.uid()) and ep.role in ('editor','admin')));

drop policy if exists "Editors can create articles" on public.articles;
create policy "Editors can create articles"
on public.articles for insert to authenticated
with check (exists (select 1 from public.editor_profiles ep where ep.user_id = (select auth.uid()) and ep.role in ('editor','admin')));

drop policy if exists "Editors can update articles" on public.articles;
create policy "Editors can update articles"
on public.articles for update to authenticated
using (exists (select 1 from public.editor_profiles ep where ep.user_id = (select auth.uid()) and ep.role in ('editor','admin')))
with check (exists (select 1 from public.editor_profiles ep where ep.user_id = (select auth.uid()) and ep.role in ('editor','admin')));

drop policy if exists "Admins can delete articles" on public.articles;
create policy "Admins can delete articles"
on public.articles for delete to authenticated
using (exists (select 1 from public.editor_profiles ep where ep.user_id = (select auth.uid()) and ep.role = 'admin'));

drop policy if exists "Editors can view their own editor profile" on public.editor_profiles;
create policy "Editors can view their own editor profile"
on public.editor_profiles for select to authenticated
using (user_id = (select auth.uid()));

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
