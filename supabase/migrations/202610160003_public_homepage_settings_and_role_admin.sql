-- Homepage settings contain only editorial display controls and must be readable by visitors.
drop policy if exists "Public can read homepage settings" on public.site_settings;
create policy "Public can read homepage settings" on public.site_settings
for select to anon, authenticated using (id = 'global');

-- Allow newsroom admins to maintain the role of already-created editor profiles.
drop policy if exists "Admins can manage editor profiles" on public.editor_profiles;
create policy "Admins can manage editor profiles" on public.editor_profiles
for all to authenticated
using (exists (select 1 from public.editor_profiles actor where actor.user_id = (select auth.uid()) and actor.role = 'admin'))
with check (exists (select 1 from public.editor_profiles actor where actor.user_id = (select auth.uid()) and actor.role = 'admin'));
