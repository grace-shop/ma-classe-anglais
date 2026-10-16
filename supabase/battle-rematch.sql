-- =====================================================================
--  BATTLES : « Rejouer » entre les mêmes élèves, sans nouveau code.
--  À exécuter APRÈS supabase/battle.sql. Sans danger à relancer.
--   • arena_rematch : l'hôte relance le même salon (même code, mêmes
--     joueurs) avec de nouvelles questions. Les autres élèves retournent
--     tout seuls au salon d'attente.
--   • La Battle Royale va plus vite : 8 secondes par question.
-- =====================================================================

create or replace function public.arena_rematch(p_room uuid, p_qs jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.arena_rooms;
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into r from public.arena_rooms where id = p_room;
  if r.id is null or r.kind = 'challenge' then raise exception 'No battle with this code'; end if;
  if r.host <> me then raise exception 'Only the host can start'; end if;
  if r.status = 'playing' then raise exception 'This battle is not running'; end if;
  if jsonb_typeof(p_qs) <> 'array' or jsonb_array_length(p_qs) < 1 or jsonb_array_length(p_qs) > 20 then raise exception 'Bad questions'; end if;
  delete from public.arena_answers where room_id = p_room;
  update public.arena_players set score = 0, alive = true where room_id = p_room;
  update public.arena_rooms
     set status = 'lobby', started_at = null, qs = p_qs,
         slot = case when kind = 'royale' then 8 else 12 end
   where id = p_room;
end $$;

-- la Battle Royale démarre avec des questions plus rapides
create or replace function public.arena_start(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.arena_rooms; cnt int;
begin
  select * into r from public.arena_rooms where id = p_room;
  if r.id is null or r.host <> me then raise exception 'Only the host can start'; end if;
  if r.status <> 'lobby' then return; end if;
  select count(*) into cnt from public.arena_players where room_id = p_room;
  if cnt < 2 then raise exception 'You need at least 2 players'; end if;
  update public.arena_rooms
     set status = 'playing', started_at = now() + interval '5 seconds',
         slot = case when kind = 'royale' then 8 else slot end
   where id = p_room;
end $$;

revoke all on function public.arena_rematch(uuid, jsonb) from public, anon;
grant execute on function public.arena_rematch(uuid, jsonb) to authenticated;
