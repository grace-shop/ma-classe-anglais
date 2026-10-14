-- =====================================================================
--  PUBLICATIONS PROGRAMMÉES (enseignants)
--  À exécuter une fois dans Supabase > SQL Editor (après communaute.sql).
--
--  Une publication programmée est enregistrée tout de suite, mais elle
--  n'apparaît dans le fil qu'à l'heure choisie (created_at = heure de
--  publication). Aucune tâche de fond n'est nécessaire.
-- =====================================================================

-- 1) Le fil ne montre que les publications déjà publiées
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated
  using (public.feed_ok()
         and created_at <= now()
         and (deleted_at is null or public.my_level() >= 3));

-- 2) Programmer une publication (enseignants seulement)
create or replace function public.schedule_post(p_body text, p_media jsonb, p_at timestamptz) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); b text := btrim(coalesce(p_body, '')); m jsonb; nid uuid;
begin
  if me is null or not public.feed_ok() or public.my_level() < 3 then raise exception 'Only teachers can schedule posts'; end if;
  if p_at is null or p_at <= now() + interval '1 minute' then raise exception 'Choose a time at least 2 minutes from now'; end if;
  if p_at > now() + interval '60 days' then raise exception 'You can schedule up to 60 days ahead'; end if;
  m := public.feed_media(p_media, 4);
  if char_length(b) < 1 and m is null then raise exception 'Write something or add a photo or video'; end if;
  if char_length(b) > 4000 then raise exception 'Post too long (4000 characters maximum)'; end if;
  insert into posts(author, who, body, media, created_at) values (me, public.feed_who(me), b, m, p_at) returning posts.id into nid;
  return nid;
end $$;

-- 3) Mes publications programmées, pas encore publiées
create or replace function public.my_scheduled_posts() returns table(id uuid, body text, created_at timestamptz, media jsonb)
language sql stable security definer set search_path = public as $$
  select p.id, p.body, p.created_at, p.media from posts p
  where p.author = auth.uid() and p.created_at > now() and p.deleted_at is null and public.my_level() >= 3
  order by p.created_at
$$;

-- 4) Annuler une publication programmée
create or replace function public.cancel_scheduled_post(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from posts where id = p_id and author = auth.uid() and created_at > now() and public.my_level() >= 3;
  if not found then raise exception 'This post is already published or does not exist'; end if;
end $$;

revoke all on function public.schedule_post(text, jsonb, timestamptz), public.my_scheduled_posts(), public.cancel_scheduled_post(uuid) from public, anon;
grant execute on function public.schedule_post(text, jsonb, timestamptz), public.my_scheduled_posts(), public.cancel_scheduled_post(uuid) to authenticated;
