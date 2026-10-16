-- Use Supabase pg_cron so scheduled publishing works on Vercel Hobby plans too.
create extension if not exists pg_cron with schema pg_catalog;

create or replace function app_private.publish_due_articles()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  with due as (
    update public.articles
    set status = 'published', published_at = now(), scheduled_at = null, updated_at = now()
    where status = 'draft' and scheduled_at is not null and scheduled_at <= now()
    returning id
  )
  update public.article_translations t
  set translation_status = 'published', updated_at = now()
  from due
  where t.article_id = due.id
    and t.language_code = 'bn'
    and t.translation_status = 'draft';
end;
$$;
revoke all on function app_private.publish_due_articles() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'publish-due-newsroom-articles';
select cron.schedule('publish-due-newsroom-articles', '* * * * *', 'select app_private.publish_due_articles();');
