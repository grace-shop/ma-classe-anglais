-- =====================================================================
--  ARENA BATTLES : réponses écrites (remettre les mots, écrire le mot)
--  À exécuter APRÈS supabase/battle-server-check.sql. Sans danger à relancer.
--
--  Une question écrite a un champ « accept » (les réponses acceptées).
--  Le serveur compare la réponse de l'élève à ces réponses, sans tenir
--  compte des majuscules, de la ponctuation ni des espaces en trop.
--  La liste « accept » n'est jamais envoyée avant la fin de la question.
-- =====================================================================

-- normalisation : minuscules, sans ponctuation, espaces simples
create or replace function public.arena_norm(t text) returns text
language sql immutable as $$
  select btrim(regexp_replace(regexp_replace(lower(coalesce(t, '')), '[^a-z0-9 ]', '', 'g'), '\s+', ' ', 'g'))
$$;

-- 1 · réponse vérifiée : choix (question à choix) ou texte (question écrite)
create or replace function public.arena_answer_v3(p_room uuid, p_idx int, p_choice int, p_text text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.arena_rooms; el numeric; cur int; p public.arena_players;
  q jsonb; correct int; answer text := null; ok boolean; pts int := 0; rem int;
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into r from public.arena_rooms where id = p_room;
  if r.id is null then raise exception 'No battle'; end if;
  if r.status <> 'playing' then raise exception 'The battle is not running'; end if;
  if p_idx < 0 or p_idx >= jsonb_array_length(r.qs) then raise exception 'Bad question'; end if;
  select * into p from public.arena_players where room_id = p_room and uid = me;
  if p.room_id is null then raise exception 'You are not in this battle'; end if;
  if r.kind <> 'challenge' then
    el := extract(epoch from (now() - r.started_at));
    if el < 0 then raise exception 'Not started yet'; end if;
    cur := floor(el / r.slot)::int;
    if p_idx <> cur then raise exception 'Too late'; end if;
  end if;
  if r.kind = 'royale' and not p.alive then raise exception 'You are out'; end if;
  if exists (select 1 from public.arena_answers a where a.room_id = p_room and a.uid = me and a.idx = p_idx) then
    raise exception 'Already answered';
  end if;
  q := r.qs -> p_idx;
  if q ? 'accept' then
    correct := null;
    answer := q -> 'accept' ->> 0;
    ok := arena_norm(p_text) <> ''
          and exists (select 1 from jsonb_array_elements_text(q -> 'accept') as a(v) where arena_norm(a.v) = arena_norm(p_text));
  else
    correct := (q ->> 'a')::int;
    ok := (p_choice = correct);
  end if;
  if ok then
    if r.kind = 'challenge' then
      pts := 10;
    else
      rem := r.slot * 1000 - (floor(extract(epoch from (now() - r.started_at)) * 1000)::bigint % (r.slot * 1000))::int;
      pts := least(30, 10 + round(rem / 1000.0)::int);
    end if;
  end if;
  insert into public.arena_answers (room_id, uid, idx, ok, pts) values (p_room, me, p_idx, ok, pts);
  update public.arena_players
     set score = score + pts,
         alive = alive and (r.kind <> 'royale' or ok)
   where room_id = p_room and uid = me;
  return jsonb_build_object('ok', ok, 'correct', correct, 'answer', answer, 'pts', pts, 'e', q ->> 'e');
end $$;

-- 2 · l'état : « a », « e » et « accept » ne sont donnés qu'après la question
create or replace function public.arena_state(p_room uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.arena_rooms; out jsonb; el numeric; cur int; qs jsonb;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not exists (select 1 from public.arena_players where room_id = p_room and uid = me) then raise exception 'You are not in this battle'; end if;
  perform public.arena_tick(p_room);
  select * into r from public.arena_rooms where id = p_room;
  el := case when r.started_at is null then -1 else extract(epoch from (now() - r.started_at)) end;
  cur := case when el < 0 then -1 else floor(el / r.slot)::int end;
  select coalesce(jsonb_agg(
           case when r.status = 'done'
                  or (r.kind <> 'challenge' and t.i - 1 < cur)
                  or exists (select 1 from public.arena_answers a where a.room_id = r.id and a.uid = me and a.idx = t.i - 1)
                then t.e
                else t.e - 'a' - 'e' - 'accept' end
           order by t.i), '[]'::jsonb)
    into qs
    from jsonb_array_elements(r.qs) with ordinality as t(e, i);
  select jsonb_build_object(
    'id', r.id, 'code', r.code, 'kind', r.kind, 'mode', r.mode, 'status', r.status,
    'qs', qs, 'slot', r.slot, 'host', r.host, 'me', me,
    'now', floor(extract(epoch from now()) * 1000),
    'started', case when r.started_at is null then null else floor(extract(epoch from r.started_at) * 1000) end,
    'players', (select coalesce(jsonb_agg(jsonb_build_object('uid', p.uid, 'name', p.name, 'alive', p.alive, 'score', p.score) order by p.score desc, p.joined_at), '[]'::jsonb)
                from public.arena_players p where p.room_id = r.id),
    'answered', (select coalesce(jsonb_agg(a.idx), '[]'::jsonb) from public.arena_answers a where a.room_id = r.id and a.uid = me)
  ) into out;
  return out;
end $$;

revoke all on function public.arena_norm(text) from public, anon;
revoke all on function public.arena_answer_v3(uuid, int, int, text) from public, anon;
grant execute on function public.arena_norm(text) to authenticated;
grant execute on function public.arena_answer_v3(uuid, int, int, text) to authenticated;
grant execute on function public.arena_state(uuid) to authenticated;

-- correctif : un compte sans fiche « students » (ex. le compte du professeur)
-- faisait échouer la création d'un salon. Le nom par défaut est désormais « Student ».
create or replace function public.arena_my_name() returns text language sql security definer stable set search_path = public as $$
  select coalesce((select nullif(btrim(d.data->>'name'), '') from docs d where d.path = 'students/' || auth.uid()::text), 'Student')
$$;
