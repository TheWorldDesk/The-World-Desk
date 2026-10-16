-- Keep editor role changes behind RLS policies and a non-exposed admin helper.
drop function if exists public.admin_upsert_editor_profile(uuid, text, text);

drop policy if exists "Admins can create editor profiles" on public.editor_profiles;
create policy "Admins can create editor profiles" on public.editor_profiles
for insert to authenticated
with check (app_private.is_admin());

drop policy if exists "Admins can update editor profiles" on public.editor_profiles;
create policy "Admins can update editor profiles" on public.editor_profiles
for update to authenticated
using (app_private.is_admin())
with check (app_private.is_admin() and (user_id <> (select auth.uid()) or role = 'admin'));
