-- Jeux : annuler une invitation envoyée, ou interrompre une partie en cours.
-- À exécuter une fois dans l'éditeur SQL de Supabase (après supabase/jeux.sql).
--  - l'invitation envoyée (en attente) est retirée : elle passe à « declined » et disparaît de la liste ;
--  - une partie en cours peut être interrompue par l'un des deux joueurs : elle passe à « over ».

create or replace function public.game_cancel(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Access denied'; end if;
  -- invitation envoyée par moi, pas encore acceptée
  update game_matches set status = 'declined', updated_at = now()
   where id = p_id and host = me and status = 'invited';
  if found then return; end if;
  -- partie en cours : l'un ou l'autre joueur peut l'interrompre
  update game_matches set status = 'over', updated_at = now()
   where id = p_id and status = 'playing' and me in (host, guest);
  if not found then raise exception 'Access denied'; end if;
end $$;
grant execute on function public.game_cancel(uuid) to authenticated;
