-- =====================================================================
--  MESSAGERIE : modifier un message envoyé.
--  À exécuter APRÈS supabase/messagerie.sql. Sans danger à relancer.
--   • seul l'expéditeur peut modifier son message, tant qu'il n'est pas supprimé
--   • le message garde la mention « modifié » (edited_at)
-- =====================================================================

alter table public.peer_messages add column if not exists edited_at timestamptz;

create or replace function public.peer_edit(p_id uuid, p_body text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); m public.peer_messages;
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into m from public.peer_messages where id = p_id;
  if m.id is null or m.sender <> me then raise exception 'You can only edit your own messages'; end if;
  if m.deleted_at is not null then raise exception 'This message was deleted'; end if;
  if char_length(btrim(coalesce(p_body, ''))) = 0 then raise exception 'The message is empty'; end if;
  if char_length(p_body) > 1000 then raise exception 'The message is too long'; end if;
  update public.peer_messages set body = btrim(p_body), edited_at = now() where id = p_id;
end $$;

revoke all on function public.peer_edit(uuid, text) from public, anon;
grant execute on function public.peer_edit(uuid, text) to authenticated;
