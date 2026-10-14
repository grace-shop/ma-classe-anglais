-- =====================================================================
--  STORIES : disparition après 24 h, pour TOUT LE MONDE (enseignants compris)
--  À exécuter une fois dans Supabase > SQL Editor (après communaute.sql et stories2.sql).
--
--  1. La lecture d'une story est refusée après 24 h, sans exception (plus de
--     période de 14 jours réservée aux enseignants).
--  2. Les vues et les réactions d'une story expirée ne sont plus lisibles.
--  3. Une fonction purge_expired_stories() supprime les stories expirées, leurs
--     vues, leurs réactions et les fichiers (photo/vidéo) qui ne servent plus.
--     Elle est lancée toutes les heures si pg_cron est disponible.
-- =====================================================================

-- 1) Lecture des stories : seulement les 24 dernières heures
drop policy if exists stories_read on public.stories;
create policy stories_read on public.stories for select to authenticated
  using (public.feed_ok()
         and deleted_at is null
         and (hide is null or hide <> auth.uid())
         and created_at > now() - interval '24 hours');

-- 2) Vues et réactions : uniquement pour une story encore active
drop policy if exists story_views_read on public.story_views;
create policy story_views_read on public.story_views for select to authenticated
  using (exists (select 1 from public.stories s
                 where s.id = story_id and s.created_at > now() - interval '24 hours')
         and (uid = auth.uid() or public.my_level() >= 3
              or exists (select 1 from public.stories s where s.id = story_id and s.author = auth.uid())));

drop policy if exists story_reactions_read on public.story_reactions;
create policy story_reactions_read on public.story_reactions for select to authenticated
  using (exists (select 1 from public.stories s
                 where s.id = story_id and s.created_at > now() - interval '24 hours')
         and (uid = auth.uid() or public.my_level() >= 3
              or exists (select 1 from public.stories s where s.id = story_id and s.author = auth.uid())));

-- 3) Purge : suppression réelle des stories expirées et de leurs fichiers
create or replace function public.purge_expired_stories() returns integer
language plpgsql security definer set search_path = public, storage as $$
declare n integer := 0; paths text[];
begin
  -- fichiers (photo, vidéo, affiche, musique) des stories expirées
  select coalesce(array_agg(distinct p), '{}') into paths from (
    select media->>'p' as p from stories where created_at < now() - interval '24 hours' and media is not null
    union
    select media->'poster'->>'p' from stories where created_at < now() - interval '24 hours' and media is not null
    union
    select music->>'b' from stories where created_at < now() - interval '24 hours' and music is not null
  ) x where p is not null and p <> '';

  -- on garde les fichiers encore utilisés par une publication ou une story récente
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    delete from storage.objects o
     where o.bucket_id = 'chat'
       and o.name = any (paths)
       and not exists (select 1 from public.posts p where p.media::text like '%' || o.name || '%')
       and not exists (select 1 from public.stories s where s.created_at >= now() - interval '24 hours'
                         and s.media::text like '%' || o.name || '%');
  end if;

  -- les vues et réactions partent avec la story (on cascade)
  delete from public.stories where created_at < now() - interval '24 hours';
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.purge_expired_stories() from public, anon, authenticated;

-- lancement automatique toutes les heures (si l'extension pg_cron est activée)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'purge-expired-stories';
    perform cron.schedule('purge-expired-stories', '0 * * * *', 'select public.purge_expired_stories()');
  else
    raise notice 'pg_cron absent : activez-le dans Database > Extensions, puis relancez ce fichier. En attendant, les stories restent invisibles après 24 h.';
  end if;
end $$;
