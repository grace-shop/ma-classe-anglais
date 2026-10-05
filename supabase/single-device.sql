-- =====================================================================
--  Ma Classe d'Anglais — UN SEUL APPAREIL PAR COMPTE (+ durcissement)
--  Supabase → SQL Editor → New query → coller → Run.  Relançable sans risque.
--  À exécuter APRÈS schema.sql, security-update.sql et xp-guard.sql.
--
--  Règle : un élève / parent ne peut être connecté que sur UN appareil.
--  Pour utiliser un autre appareil, il doit d'abord se déconnecter du premier
--  (Menu → Se déconnecter). Si le premier appareil est simplement éteint ou
--  sans réseau, le verrou s'ouvre tout seul après 5 minutes (lock_ttl_seconds).
--  Les professeurs et la prof principale ne sont jamais limités.
--  Le verrou est vérifié PAR LE SERVEUR (impossible à contourner dans l'écran).
-- =====================================================================

insert into public.app_config(key, value) values
  ('single_device',     'true'),   -- 'false' pour désactiver la règle pour toute la classe
  ('lock_ttl_seconds',  '300')     -- délai avant libération automatique d'un appareil inactif
on conflict (key) do nothing;

create table if not exists public.device_lock (
  uid       uuid primary key references auth.users(id) on delete cascade,
  sid       text not null,                       -- identifiant de session (JWT) = la connexion
  device    text,                                -- identifiant de l'appareil
  label     text,
  last_seen timestamptz not null default now()
);
alter table public.device_lock enable row level security;   -- aucune policy : accès uniquement via les fonctions

-- Identifiant de la connexion en cours (session JWT, sinon en-tête appareil)
create or replace function public.my_sid() returns text
language plpgsql stable set search_path = public as $$
declare hdr text; dev text;
begin
  if coalesce(auth.jwt()->>'session_id', '') <> '' then return auth.jwt()->>'session_id'; end if;
  hdr := current_setting('request.headers', true);
  if hdr is not null and hdr <> '' then
    begin dev := (hdr::jsonb)->>'x-device-id'; exception when others then dev := null; end;
  end if;
  return dev;
end $$;

-- Cet utilisateur est-il soumis à la règle « un seul appareil » ?
create or replace function public.single_device_applies(p_uid uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare lv int; ov text;
begin
  if coalesce((select value from app_config where key = 'single_device'), 'true') <> 'true' then return false; end if;
  select level_rank(level) into lv from members where uid = p_uid;
  if coalesce(lv, 1) >= 3 then return false; end if;                      -- professeurs : libres
  select data->>'singleDevice' into ov from docs where path = 'access/' || p_uid::text;
  if ov = 'false' then return false; end if;                              -- dérogation accordée par la prof
  return true;
end $$;

-- Un autre appareil détient-il le verrou en ce moment ?
create or replace function public.locked_by_other(p_uid uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare l record; ttl int := coalesce((select value::int from app_config where key = 'lock_ttl_seconds'), 300);
begin
  if not single_device_applies(p_uid) then return false; end if;
  select * into l from device_lock where uid = p_uid;
  if not found then return false; end if;
  return l.sid is distinct from public.my_sid() and l.last_seen > now() - make_interval(secs => ttl);
end $$;

-- Prendre (ou rafraîchir) le verrou. Appelée à la connexion puis toutes les 60 s.
--   → 'ok' | 'busy' (déjà connecté ailleurs) | 'blocked' (appareil suspendu par la prof)
create or replace function public.claim_device(p_device text default null, p_label text default null) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); a jsonb; l record; sid text := public.my_sid();
        ttl int := coalesce((select value::int from app_config where key = 'lock_ttl_seconds'), 300);
begin
  if me is null then return 'blocked'; end if;
  select data into a from docs where path = 'access/' || me::text;
  if a is not null and p_device is not null and coalesce((a->'blockedDevices'->>p_device)::boolean, false) then return 'blocked'; end if;
  if coalesce(a->>'status', '') in ('blocked', 'refused') and not (public.my_level() >= 3) then return 'blocked'; end if;
  if not single_device_applies(me) then return 'ok'; end if;
  select * into l from device_lock where uid = me for update;
  if not found or l.sid = sid or l.last_seen < now() - make_interval(secs => ttl) then
    insert into device_lock(uid, sid, device, label, last_seen)
      values (me, sid, left(p_device, 60), left(p_label, 80), now())
      on conflict (uid) do update set sid = excluded.sid, device = excluded.device, label = excluded.label, last_seen = now();
    return 'ok';
  end if;
  return 'busy';
end $$;

-- Se déconnecter proprement : libère le verrou tout de suite
create or replace function public.release_device() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from device_lock where uid = auth.uid() and sid = public.my_sid();
end $$;

-- La professeure libère le compte d'un élève (téléphone perdu, élève bloqué dehors…)
create or replace function public.free_device(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_level() < 3 then raise exception 'permission denied' using errcode = '42501'; end if;
  delete from device_lock where uid = p_uid;
end $$;

-- La professeure voit quel appareil est actif en ce moment
create or replace function public.device_lock_info(p_uid uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare l record;
begin
  if public.my_level() < 3 then raise exception 'permission denied' using errcode = '42501'; end if;
  select * into l from device_lock where uid = p_uid;
  if not found then return null; end if;
  return jsonb_build_object('device', l.device, 'label', l.label, 'last_seen', l.last_seen);
end $$;

revoke all on function public.claim_device(text, text) from public, anon;
revoke all on function public.release_device() from public, anon;
revoke all on function public.free_device(uuid) from public, anon;
revoke all on function public.device_lock_info(uuid) from public, anon;
grant execute on function public.claim_device(text, text) to authenticated;
grant execute on function public.release_device() to authenticated;
grant execute on function public.free_device(uuid) to authenticated;
grant execute on function public.device_lock_info(uuid) to authenticated;

-- my_level() : on ajoute la règle du verrou (tout le reste est identique à security-update.sql)
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
    if public.locked_by_other(auth.uid()) then return 1; end if;          -- ← un autre appareil est connecté
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

-- ---------- Durcissement : fichiers envoyés (images / PDF / audio, 8 Mo max) ----------
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    update storage.buckets
       set file_size_limit = 8388608,
           allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','application/pdf','audio/mpeg','audio/mp4','audio/webm','audio/ogg']
     where id = 'assets';
  end if;
end $$;

-- ---------- Nettoyage : un compte supprimé ne laisse rien derrière lui ----------
delete from public.device_lock where last_seen < now() - interval '30 days';
