-- Persistent newsroom site controls, image storage, and article revision snapshots.
create table if not exists public.site_settings (
  id text primary key default 'global' check (id = 'global'),
  settings jsonb not null default '{"breaking_news_enabled":false,"breaking_news_text_en":"","breaking_news_text_bn":"","homepage_featured_article_ids":[],"homepage_section_order":["World","Politics","Business","Technology","Science","Health","Sports","Culture"]}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.site_settings enable row level security;
drop policy if exists "Editors can read site settings" on public.site_settings;
create policy "Editors can read site settings" on public.site_settings for select to authenticated
using (exists (select 1 from public.editor_profiles ep where ep.user_id = (select auth.uid()) and ep.role in ('admin','editor')));
drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings" on public.site_settings for all to authenticated
using (exists (select 1 from public.editor_profiles ep where ep.user_id = (select auth.uid()) and ep.role = 'admin'))
with check (exists (select 1 from public.editor_profiles ep where ep.user_id = (select auth.uid()) and ep.role = 'admin'));
insert into public.site_settings (id) values ('global') on conflict (id) do nothing;

create table if not exists public.article_revisions (
  id bigint generated always as identity primary key,
  article_id uuid not null references public.articles(id) on delete cascade,
  snapshot jsonb not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete set null
);
create index if not exists article_revisions_article_changed_idx on public.article_revisions(article_id, changed_at desc);
alter table public.article_revisions enable row level security;
drop policy if exists "Editors can read article revisions" on public.article_revisions;
create policy "Editors can read article revisions" on public.article_revisions for select to authenticated
using (exists (select 1 from public.editor_profiles ep where ep.user_id = (select auth.uid()) and ep.role in ('admin','editor')));
drop policy if exists "Editors can insert article revisions" on public.article_revisions;
create policy "Editors can insert article revisions" on public.article_revisions for insert to authenticated
with check (exists (select 1 from public.editor_profiles ep where ep.user_id = (select auth.uid()) and ep.role in ('admin','editor')));

create or replace function public.capture_article_revision()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if row(old.title, old.slug, old.category, old.status, old.excerpt, old.content, old.image_url, old.author_name)
     is distinct from
     row(new.title, new.slug, new.category, new.status, new.excerpt, new.content, new.image_url, new.author_name) then
    insert into public.article_revisions (article_id, snapshot, changed_by)
    values (old.id, jsonb_build_object(
      'title', old.title, 'slug', old.slug, 'category', old.category, 'status', old.status,
      'excerpt', old.excerpt, 'content', old.content, 'image_url', old.image_url,
      'author_name', old.author_name, 'published_at', old.published_at
    ), (select auth.uid()));
  end if;
  return new;
end;
$$;
drop trigger if exists articles_capture_revision on public.articles;
create trigger articles_capture_revision before update on public.articles for each row execute function public.capture_article_revision();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('newsroom-media', 'newsroom-media', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/avif'];
drop policy if exists "Public can view newsroom media" on storage.objects;
create policy "Public can view newsroom media" on storage.objects for select to public using (bucket_id = 'newsroom-media');
drop policy if exists "Editors can upload newsroom media" on storage.objects;
create policy "Editors can upload newsroom media" on storage.objects for insert to authenticated with check (
  bucket_id = 'newsroom-media' and exists (select 1 from public.editor_profiles ep where ep.user_id = (select auth.uid()) and ep.role in ('admin','editor'))
);
drop policy if exists "Editors can update newsroom media" on storage.objects;
create policy "Editors can update newsroom media" on storage.objects for update to authenticated using (
  bucket_id = 'newsroom-media' and exists (select 1 from public.editor_profiles ep where ep.user_id = (select auth.uid()) and ep.role in ('admin','editor'))
) with check (
  bucket_id = 'newsroom-media' and exists (select 1 from public.editor_profiles ep where ep.user_id = (select auth.uid()) and ep.role in ('admin','editor'))
);
drop policy if exists "Editors can delete newsroom media" on storage.objects;
create policy "Editors can delete newsroom media" on storage.objects for delete to authenticated using (
  bucket_id = 'newsroom-media' and exists (select 1 from public.editor_profiles ep where ep.user_id = (select auth.uid()) and ep.role in ('admin','editor'))
);
