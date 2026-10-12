-- =====================================================================
--  MODE CLASSE : la professeure met en pause les messages et les appels
--  entre élèves (pour toute la classe), en un clic dans l'application.
--  À exécuter APRÈS messagerie.sql (remplace peer_ok).
--  Réglage : settings/main → chatPaused = true / false
--  Les professeurs gardent leurs propres échanges ; les élèves ne peuvent
--  plus envoyer de messages ni appeler leurs camarades tant que c'est en pause.
--  Peut être relancé sans risque.
-- =====================================================================

create or replace function public.peer_ok(u uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare lvl text; sd jsonb; ad jsonb; appr text; st text; paused text;
begin
  select level into lvl from members where uid = u;
  if coalesce(lvl, 'interact') <> 'interact' then return false; end if;
  select data into sd from docs where path = 'students/' || u::text;
  if sd is null then return false; end if;
  if coalesce(sd->>'profile', '') in ('primaire', 'parent') then return false; end if;
  select data into ad from docs where path = 'access/' || u::text;
  select data->>'approve' into appr from docs where path = 'settings/main';
  st := coalesce(ad->>'status', case when appr = 'false' then 'active' else 'pending' end);
  if st <> 'active' then return false; end if;
  if coalesce(ad->>'noChat', '') = 'true' then return false; end if;
  select data->>'chatPaused' into paused from docs where path = 'settings/main';
  if coalesce(paused, 'false') = 'true' then return false; end if;
  return true;
end $$;

revoke all on function public.peer_ok(uuid) from public, anon;
grant execute on function public.peer_ok(uuid) to authenticated;
