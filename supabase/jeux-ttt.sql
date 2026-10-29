-- Morpion (ttt) : à lancer une fois dans Supabase (SQL Editor) si les jeux existent déjà.
-- Sans cela, l'invitation de morpion est refusée par la base et la personne ne la reçoit pas.

alter table game_matches drop constraint if exists game_matches_kind_check;
alter table game_matches add constraint game_matches_kind_check check (kind in ('chess', 'ludo', 'morris', 'ttt'));

create or replace function public.game_invite(p_to uuid, p_kind text, p_state jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); id uuid;
begin
  if me is null or p_to is null or p_to = me then raise exception 'Access denied'; end if;
  if p_kind not in ('chess', 'ludo', 'morris', 'ttt') then raise exception 'Unknown game'; end if;
  if not public.peer_ok(p_to) then raise exception 'You can only invite a classmate who accepts messages'; end if;
  insert into game_matches (kind, host, guest, status, state) values (p_kind, me, p_to, 'invited', p_state) returning game_matches.id into id;
  return id;
end $$;
grant execute on function public.game_invite(uuid, text, jsonb) to authenticated;

-- Parties en direct : le coup de l'autre joueur arrive tout de suite (au lieu d'attendre l'actualisation).
do $$ begin
  alter publication supabase_realtime add table public.game_matches;
exception when duplicate_object then null;
end $$;
