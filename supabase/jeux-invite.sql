-- Invitation de jeu : la personne invitée reçoit aussi une notification (cloche + bandeau en haut).
-- À lancer une fois dans Supabase (SQL Editor), après supabase/jeux-ttt.sql.

create or replace function public.game_invite(p_to uuid, p_kind text, p_state jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); id uuid;
begin
  if me is null or p_to is null or p_to = me then raise exception 'Access denied'; end if;
  if p_kind not in ('chess', 'ludo', 'morris', 'ttt') then raise exception 'Unknown game'; end if;
  if not public.peer_ok(p_to) then raise exception 'You can only invite a classmate who accepts messages'; end if;
  insert into game_matches (kind, host, guest, status, state) values (p_kind, me, p_to, 'invited', p_state) returning game_matches.id into id;
  -- la notification : elle apparaît dans la cloche et sur le bandeau en haut de l'écran de la personne
  insert into notifications (uid, kind, actor, who, ref, body)
  values (p_to, 'game', me, public.feed_who(me), 'game:' || id::text, p_kind);
  return id;
end $$;
grant execute on function public.game_invite(uuid, text, jsonb) to authenticated;
