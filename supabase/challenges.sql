-- =====================================================================
--  DÉFIS EN ANGLAIS dans la Communauté + notifications pour tout le monde.
--  À exécuter APRÈS communaute.sql, push.sql et post-edit.sql.
--  Un défi est une publication de la professeure :
--    'challenge' = répondre en anglais dans les commentaires
--    'word'      = mot ou expression du jour
--    'correct'   = corriger la phrase donnée
--  Chaque élève reçoit une notification (et une notification push).
-- =====================================================================

alter table public.posts add column if not exists kind text not null default 'post';

create or replace function public.create_challenge(p_body text, p_kind text default 'challenge')
returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); b text := btrim(coalesce(p_body, '')); k text; nid uuid; r record;
begin
  if me is null or not public.feed_ok() then raise exception 'Community is not available for your account'; end if;
  if public.my_level() < 3 then raise exception 'Only teachers can post a challenge'; end if;
  k := case when p_kind in ('challenge', 'word', 'correct') then p_kind else 'challenge' end;
  if char_length(b) < 3 then raise exception 'Write the challenge first'; end if;
  if char_length(b) > 4000 then raise exception 'Challenge too long (4000 characters maximum)'; end if;
  insert into posts(author, who, body, media, kind)
  values (me, public.feed_who(me), b, '[]'::jsonb, k)
  returning posts.id into nid;
  -- une notification à chaque élève (et une notification push)
  for r in select uid from members where uid <> me loop
    insert into notifications(uid, kind, actor, who, ref, body)
    values (r.uid, 'challenge', me, public.feed_who(me), 'post:' || nid::text, left(b, 120));
  end loop;
  return nid;
end $$;

revoke all on function public.create_challenge(text, text) from public, anon;
grant execute on function public.create_challenge(text, text) to authenticated;
