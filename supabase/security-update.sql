-- =====================================================================
--  Ma Classe d'Anglais — MISE À JOUR SÉCURITÉ (à exécuter une fois)
--  Supabase → SQL Editor → New query → coller → Run. Sans risque : relançable.
--  Ce que ça corrige :
--   1) Un appareil suspendu (ou non autorisé quand une limite est fixée)
--      est maintenant bloqué PAR LE SERVEUR, pas seulement dans l'écran.
--   2) Un compte « en attente de validation » n'a plus accès aux données
--      de la classe tant que la professeure ne l'a pas accepté.
-- =====================================================================

create or replace function public.my_level() returns int
language plpgsql stable security definer set search_path = public as $$
declare lv int; a jsonb; st text; hdr text; dev text;
begin
  if auth.uid() is null then return 0; end if;
  select level_rank(level) into lv from members where uid = auth.uid();
  lv := coalesce(lv, 1);
  if lv <= 2 then
    select data into a from docs where path = 'access/' || auth.uid()::text;
    st := a->>'status';
    if st in ('blocked', 'refused') then return 1; end if;
    -- Identifiant d'appareil envoyé par l'application (absent en temps réel : on ne bloque pas)
    hdr := current_setting('request.headers', true);
    if hdr is not null and hdr <> '' then
      begin dev := (hdr::jsonb)->>'x-device-id'; exception when others then dev := null; end;
      if a is not null then
        if dev is not null and coalesce((a->'blockedDevices'->>dev)::boolean, false) then return 1; end if;
        if coalesce((a->>'deviceLimit')::int, 0) > 0
           and (dev is null or not coalesce((a->'allowedDevices'->>dev)::boolean, false)) then return 1; end if;
      end if;
    end if;
  end if;
  return lv;
end $$;

-- Compte en attente de validation ?
create or replace function public.my_pending() returns boolean
language plpgsql stable security definer set search_path = public as $$
declare lv int; st text; ap text;
begin
  if auth.uid() is null then return false; end if;
  select level_rank(level) into lv from members where uid = auth.uid();
  if coalesce(lv, 1) >= 3 then return false; end if;
  select data->>'status' into st from docs where path = 'access/' || auth.uid()::text;
  if st in ('active', 'blocked', 'refused') then return false; end if;
  select data->>'approve' into ap from docs where path = 'settings';
  if st is null and ap = 'false' then return false; end if;   -- validation désactivée par la prof
  return true;
end $$;

-- Un compte en attente ne peut lire que le contenu public et gérer SA propre inscription
create or replace function public.can(p text, op text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_level() > 0
     and public.my_level() >= public.required_level(p, op)
     and ( not public.my_pending()
           or public.required_level(p, op) <= 1
           or p = 'students/' || auth.uid()::text
           or p = 'staffRequests/' || auth.uid()::text
           or (op = 'read' and p = 'access/' || auth.uid()::text) )
$$;
