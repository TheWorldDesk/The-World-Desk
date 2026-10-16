-- Homepage settings contain only editorial display controls and must be readable by visitors.
drop policy if exists "Public can read homepage settings" on public.site_settings;
create policy "Public can read homepage settings" on public.site_settings
for select to anon, authenticated using (id = 'global');
