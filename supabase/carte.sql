-- =====================================================================
--  PRÈS DE MOI : partage de position entre camarades (facultatif)
--  À exécuter APRÈS messagerie.sql (et de préférence après classe.sql).
--  Règles :
--   • désactivé par défaut ; l'élève choisit de partager ou non
--   • position arrondie à 0,01° (environ 1 km) : jamais une adresse précise
--   • partage limité à 8 heures, puis effacé automatiquement pour les autres
--   • visible seulement par les camarades actifs, jamais par un élève bloqué
--   • les élèves du primaire et les parents ne sont pas concernés
-- =====================================================================

create table if not exists public.locations (
  uid        uuid primary key references auth.users(id) on delete cascade,
  lat        double precision not null default 0,
  lng        double precision not null default 0,
  sharing    boolean not null default false,
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now()
);
alter table public.locations enable row level security;
revoke all on public.locations from anon, authenticated;

-- l'élève active / désactive son partage (aucune lecture directe de la table)
create or replace function public.share_location(p_lat double precision, p_lng double precision, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if not public.peer_ok(auth.uid()) then raise exception 'not allowed'; end if;
  if p_on then
    if p_lat is null or p_lng is null or p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then
      raise exception 'bad position';
    end if;
    insert into public.locations (uid, lat, lng, sharing, updated_at, expires_at)
    values (auth.uid(), round(p_lat::numeric, 2)::float8, round(p_lng::numeric, 2)::float8, true, now(), now() + interval '8 hours')
    on conflict (uid) do update set
      lat = excluded.lat, lng = excluded.lng, sharing = true,
      updated_at = now(), expires_at = now() + interval '8 hours';
  else
    update public.locations set sharing = false, expires_at = now() where uid = auth.uid();
  end if;
end $$;

-- mon propre état de partage
create or replace function public.my_location()
returns table (sharing boolean, lat double precision, lng double precision, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select l.sharing and l.expires_at > now(), l.lat, l.lng, l.expires_at
  from public.locations l where l.uid = auth.uid()
$$;

-- les camarades qui partagent en ce moment (jamais moi, jamais un élève bloqué)
create or replace function public.nearby_classmates()
returns table (uid uuid, name text, lat double precision, lng double precision, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.peer_ok(auth.uid()) then return; end if;
  return query
    select l.uid,
           coalesce((select d.data->>'name' from docs d where d.path = 'students/' || l.uid::text), 'Classmate'),
           l.lat, l.lng, l.updated_at
    from public.locations l
    where l.sharing
      and l.expires_at > now()
      and l.uid <> auth.uid()
      and public.peer_ok(l.uid)
      and not exists (select 1 from public.blocks b where (b.uid = auth.uid() and b.blocked = l.uid) or (b.uid = l.uid and b.blocked = auth.uid()))
    order by l.updated_at desc
    limit 100;
end $$;

revoke all on function public.share_location(double precision, double precision, boolean), public.my_location(), public.nearby_classmates() from public, anon;
grant execute on function public.share_location(double precision, double precision, boolean), public.my_location(), public.nearby_classmates() to authenticated;
