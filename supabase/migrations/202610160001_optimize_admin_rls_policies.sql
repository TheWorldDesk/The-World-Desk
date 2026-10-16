-- Keep authorization checks stable per statement instead of re-evaluating auth.uid() per row.
ALTER POLICY "Editors can read analytics"
  ON public.site_page_views
  USING (
    EXISTS (
      SELECT 1
      FROM public.editor_profiles ep
      WHERE ep.user_id = (SELECT auth.uid())
        AND ep.role = 'admin'
    )
  );

ALTER POLICY "Admins can read ad settings"
  ON public.site_ad_settings
  USING (
    EXISTS (
      SELECT 1
      FROM public.editor_profiles ep
      WHERE ep.user_id = (SELECT auth.uid())
        AND ep.role = 'admin'
    )
  );

ALTER POLICY "Admins can update ad settings"
  ON public.site_ad_settings
  USING (
    EXISTS (
      SELECT 1
      FROM public.editor_profiles ep
      WHERE ep.user_id = (SELECT auth.uid())
        AND ep.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.editor_profiles ep
      WHERE ep.user_id = (SELECT auth.uid())
        AND ep.role = 'admin'
    )
  );
