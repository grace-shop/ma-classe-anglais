-- =====================================================================
-- Profiles: avatars (Bitmoji style) and bios
--   * students keep their avatar and bio in their own document students/<uid> (fields avt, bio)
--   * teachers keep them in public.profile_extra (they cannot write staff/<uid>)
--   * profiles_min(uids)  → name, class, bio, avatar… of the people the caller may see (max 200)
--   * get_profile(uid)    → the same for one person, with their XP
-- Run after messagerie.sql and communaute.sql. Idempotent.
-- =====================================================================

create table if not exists public.profile_extra (
  uid        uuid primary key references auth.users(id) on delete cascade,
  avt        jsonb,
  bio        text not null default '' check (char_length(bio) <= 150),
  updated_at timestamptz not null default now(),
  constraint profile_extra_avt_size check (avt is null or octet_length(avt::text) < 2000)
);
alter table public.profile_extra enable row level security;
drop policy if exists profile_extra_read on public.profile_extra;
drop policy if exists profile_extra_ins  on public.profile_extra;
drop policy if exists profile_extra_upd  on public.profile_extra;
drop policy if exists profile_extra_del  on public.profile_extra;
create policy profile_extra_read on public.profile_extra for select to authenticated using (uid = auth.uid());
create policy profile_extra_ins  on public.profile_extra for insert to authenticated with check (uid = auth.uid() and public.my_level() >= 2);
create policy profile_extra_upd  on public.profile_extra for update to authenticated using (uid = auth.uid()) with check (uid = auth.uid());
create policy profile_extra_del  on public.profile_extra for delete to authenticated using (uid = auth.uid());
revoke all on public.profile_extra from anon, authenticated;
grant select, insert, update, delete on public.profile_extra to authenticated;

-- one row for a person (no access check here: internal helper)
create or replace function public.profile_of(u uuid)
returns table(uid uuid, name text, classe text, bio text, avt jsonb, photo text, ava text, role text, xp bigint)
language plpgsql stable security definer set search_path = public as $$
declare s jsonb; t jsonb; x record; a jsonb;
begin
  select data into s from docs where path = 'students/' || u::text;
  select p.avt, p.bio into x from profile_extra p where p.uid = u;
  if s is not null then
    if coalesce(s->>'profile', '') = 'parent' then return; end if;
    a := case when jsonb_typeof(s->'avt') = 'object' and octet_length((s->'avt')::text) < 2000 then s->'avt' else null end;
    return query select u, coalesce(nullif(s->>'name', ''), 'Student'), coalesce(s->>'classe', ''),
      left(coalesce(nullif(s->>'bio', ''), x.bio, ''), 150), coalesce(a, x.avt), s->>'photo', s->>'ava', 'student'::text,
      coalesce((s->>'xp')::numeric, 0)::bigint;
    return;
  end if;
  select data into t from docs where path = 'staff/' || u::text;
  if t is not null then
    a := case when jsonb_typeof(t->'avt') = 'object' and octet_length((t->'avt')::text) < 2000 then t->'avt' else null end;
    return query select u, coalesce(nullif(t->>'name', ''), case when t->>'role' = 'principal' then 'Head teacher' else 'Teacher' end), ''::text,
      left(coalesce(x.bio, nullif(t->>'bio', ''), ''), 150), coalesce(x.avt, a), t->>'photo', null::text, 'teacher'::text, null::bigint;
  end if;
end $$;
revoke all on function public.profile_of(uuid) from public, anon, authenticated;

-- may the caller see this person?
create or replace function public.profile_visible(me uuid, u uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  if me is null or u is null then return false; end if;
  if u = me then return true; end if;
  if public.my_level() >= 3 then return true; end if;                       -- teachers see everybody
  if public.my_level() <> 2 or not public.peer_ok(me) then return false; end if;
  if exists (select 1 from blocks b where (b.uid = me and b.blocked = u) or (b.uid = u and b.blocked = me)) then return false; end if;
  if exists (select 1 from docs where path = 'staff/' || u::text) then return true; end if;   -- a teacher of the school
  return public.peer_ok(u);                                                  -- an active student of the school
end $$;
revoke all on function public.profile_visible(uuid, uuid) from public, anon, authenticated;

drop function if exists public.profiles_min(uuid[]);
create or replace function public.profiles_min(p_uids uuid[])
returns table(uid uuid, name text, classe text, bio text, avt jsonb, photo text, ava text, role text)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or p_uids is null then return; end if;
  if public.my_level() < 3 and not (public.my_level() = 2 and public.peer_ok(me)) then return; end if;
  return query
    select p.uid, p.name, p.classe, p.bio, p.avt, p.photo, p.ava, p.role
    from (select distinct x from unnest(p_uids[1:200]) as x where x is not null) ids
    cross join lateral public.profile_of(ids.x) p
    where public.profile_visible(me, ids.x);
end $$;

drop function if exists public.get_profile(uuid);
create or replace function public.get_profile(p_uid uuid)
returns table(uid uuid, name text, classe text, bio text, avt jsonb, photo text, ava text, role text, xp bigint)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or p_uid is null or not public.profile_visible(me, p_uid) then return; end if;
  if public.my_level() < 3 and p_uid <> me and not public.peer_ok(me) then return; end if;
  return query select * from public.profile_of(p_uid);
end $$;

revoke all on function public.profiles_min(uuid[]), public.get_profile(uuid) from public, anon;
grant execute on function public.profiles_min(uuid[]), public.get_profile(uuid) to authenticated;

-- Photo de couverture (en haut du profil) : visible comme la fiche du camarade
create or replace function public.profile_cover(p_uid uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); c text;
begin
  if me is null or p_uid is null or not public.profile_visible(me, p_uid) then return null; end if;
  if public.my_level() < 3 and p_uid <> me and not public.peer_ok(me) then return null; end if;
  select coalesce(d->>'cover', '') into c from docs where path = 'students/' || p_uid::text;
  if c is null or c = '' or c !~ '^https://[^/]+/storage/v1/object/public/avatars/' then return null; end if;
  return c;
end $$;
revoke all on function public.profile_cover(uuid) from public, anon;
grant execute on function public.profile_cover(uuid) to authenticated;
