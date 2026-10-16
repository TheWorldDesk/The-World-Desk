-- Newsroom completion: admin-safe editor management and scheduling metadata.
alter table public.articles add column if not exists scheduled_at timestamptz;
create index if not exists articles_scheduled_at_idx on public.articles(scheduled_at) where scheduled_at is not null and status = 'draft';

create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;

create or replace function app_private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.editor_profiles where user_id = auth.uid() and role = 'admin');
$$;
revoke all on function app_private.is_admin() from public, anon;
grant execute on function app_private.is_admin() to authenticated;

drop policy if exists "Admins can view all editor profiles" on public.editor_profiles;
create policy "Admins can view all editor profiles" on public.editor_profiles
for select to authenticated using (app_private.is_admin());

drop policy if exists "Admins can update editor profiles" on public.editor_profiles;
create policy "Admins can update editor profiles" on public.editor_profiles
for update to authenticated using (app_private.is_admin())
with check (app_private.is_admin() and (user_id <> (select auth.uid()) or role = 'admin'));

create or replace function public.admin_upsert_editor_profile(p_user_id uuid, p_display_name text, p_role text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not app_private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_role not in ('admin', 'editor') then
    raise exception 'Role must be admin or editor' using errcode = '22023';
  end if;
  if p_user_id = auth.uid() and p_role <> 'admin' then
    raise exception 'You cannot remove your own admin role' using errcode = '42501';
  end if;
  insert into public.editor_profiles (user_id, display_name, role)
  values (p_user_id, nullif(trim(p_display_name), ''), p_role)
  on conflict (user_id) do update set display_name = excluded.display_name, role = excluded.role;
end;
$$;
revoke all on function public.admin_upsert_editor_profile(uuid, text, text) from public, anon;
grant execute on function public.admin_upsert_editor_profile(uuid, text, text) to authenticated;

create index if not exists article_revisions_changed_by_idx on public.article_revisions(changed_by);
create index if not exists site_settings_updated_by_idx on public.site_settings(updated_by);
