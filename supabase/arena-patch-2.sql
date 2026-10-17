-- =====================================================================
--  CORRECTIF 2 ARENA (à exécuter après arena-patch.sql). Sans danger à relancer.
--
--  1. arena_rematch : la revanche. L'hôte relance une battle terminée avec
--     les mêmes joueurs et le même code. Le salon revient en attente ;
--     l'hôte lance la partie avec « Start ».
--  2. arena_answer (ancienne version) : elle faisait confiance au téléphone
--     pour dire si la réponse était bonne. L'app n'utilise plus cette version
--     (arena_answer_v3 vérifie la réponse sur le serveur), donc on la retire
--     aux comptes connectés.
-- =====================================================================

-- 1 · revanche (hôte seulement, une fois la partie terminée)
create or replace function public.arena_rematch(p_room uuid, p_qs jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.arena_rooms;
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into r from public.arena_rooms where id = p_room;
  if r.id is null then raise exception 'No battle'; end if;
  if r.host <> me then raise exception 'Only the host can start'; end if;
  if r.kind = 'challenge' then raise exception 'This battle is not running'; end if;
  if r.status <> 'done' then raise exception 'The battle is not finished yet'; end if;
  if jsonb_typeof(p_qs) <> 'array' or jsonb_array_length(p_qs) < 1 or jsonb_array_length(p_qs) > 40 then
    raise exception 'Bad questions';
  end if;
  delete from public.arena_answers where room_id = p_room;
  update public.arena_players set score = 0, alive = true where room_id = p_room;
  update public.arena_rooms set qs = p_qs, status = 'lobby', started_at = null where id = p_room;
end $$;

revoke all on function public.arena_rematch(uuid, jsonb) from public, anon;
grant execute on function public.arena_rematch(uuid, jsonb) to authenticated;

-- 2 · ancienne réponse « de confiance » : retirée aux comptes connectés
revoke execute on function public.arena_answer(uuid, int, boolean, int) from authenticated;
