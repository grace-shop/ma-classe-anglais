-- =====================================================================
--  Ma Classe d'Anglais — base de données Supabase
--  À coller en entier dans Supabase → SQL Editor → New query → Run.
--  AVANT d'exécuter : remplacez VOTRE-EMAIL@gmail.com (ligne ~20) par
--  l'adresse de la professeure principale (propriétaire de l'application).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Réglages ----------
create table if not exists public.app_config (
  key   text primary key,
  value text not null
);
alter table public.app_config enable row level security;

insert into public.app_config(key, value) values
  ('owner_email',   'VOTRE-EMAIL@gmail.com'),   -- ← la professeure principale
  ('default_level', 'interact'),                -- niveau donné à chaque nouveau compte
  ('ai_daily_limit_student', '120'),            -- messages IA par jour et par élève
  ('ai_daily_limit_teacher', '600')             -- messages IA par jour et par professeur
on conflict (key) do nothing;

-- ---------- Membres et niveaux d'accès ----------
--  view < interact (élèves, parents) < admin (professeurs) < owner (prof principale)
create table if not exists public.members (
  uid        uuid primary key references auth.users(id) on delete cascade,
  email      text,
  level      text not null default 'interact' check (level in ('view','interact','admin','owner')),
  created_at timestamptz not null default now()
);
alter table public.members enable row level security;

create or replace function public.level_rank(l text) returns int
language sql immutable as $$
  select case l when 'view' then 1 when 'interact' then 2 when 'admin' then 3 when 'owner' then 4 else 0 end
$$;

-- ---------- Documents (même modèle que l'application : collections / documents) ----------
create table if not exists public.docs (
  path       text primary key,
  col        text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  constraint docs_path_format check (path ~ '^[A-Za-z0-9_.~:@+-]{1,200}(/[A-Za-z0-9_.~:@+-]{1,200}){1,14}$'),
  constraint docs_path_even   check (array_length(string_to_array(path, '/'), 1) % 2 = 0),
  constraint docs_size        check (octet_length(data::text) < 900000)
);
create index if not exists docs_col_idx on public.docs (col);

create or replace function public.docs_fill() returns trigger
language plpgsql as $$
begin
  new.col := regexp_replace(new.path, '/[^/]+$', '');
  new.id  := regexp_replace(new.path, '^.*/', '');
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;
drop trigger if exists docs_fill on public.docs;
create trigger docs_fill before insert or update on public.docs
  for each row execute function public.docs_fill();

-- ---------- Règles d'accès (identiques à la version Claude) ----------
create table if not exists public.access_rules (
  pattern     text primary key,
  read_level  text,
  write_level text
);
alter table public.access_rules enable row level security;
delete from public.access_rules;
insert into public.access_rules(pattern, read_level, write_level) values
  ('',                       'view',     'admin'),
  ('students',               'admin',    'admin'),
  ('students/{self}',        'interact', 'interact'),
  ('board',                  'interact', 'admin'),
  ('board/{self}',           null,       'interact'),
  ('corriges',               'admin',    'admin'),
  ('settings',               null,       'owner'),
  ('staff',                  'view',     'owner'),
  ('staffRequests',          'owner',    'owner'),
  ('staffRequests/{self}',   'interact', 'interact'),
  ('access',                 'admin',    'admin'),
  ('access/{self}',          'interact', 'admin'),
  ('live',                   'interact', 'admin'),
  ('gradebook',              'admin',    'admin'),
  ('attendance',             'admin',    'admin'),
  ('parents',                'admin',    'admin'),
  ('parents/{self}',         'interact', 'admin');

-- Niveau de la personne connectée (un compte suspendu ou refusé redescend à « view »)
create or replace function public.my_level() returns int
language plpgsql stable security definer set search_path = public as $$
declare lv int; st text;
begin
  if auth.uid() is null then return 0; end if;
  select level_rank(level) into lv from members where uid = auth.uid();
  lv := coalesce(lv, 1);
  if lv <= 2 then
    select data->>'status' into st from docs where path = 'access/' || auth.uid()::text;
    if st in ('blocked', 'refused') then lv := 1; end if;
  end if;
  return lv;
end $$;

-- Niveau exigé pour lire / écrire un chemin : la règle la plus précise gagne
create or replace function public.required_level(p text, op text) returns int
language plpgsql stable security definer set search_path = public as $$
declare
  segs text[] := string_to_array(p, '/');
  me   text   := coalesce(auth.uid()::text, '');
  r record; ps text[]; n int; ok boolean; best int := -1; lvl text;
begin
  for r in select * from access_rules loop
    ps := case when r.pattern = '' then '{}'::text[] else string_to_array(r.pattern, '/') end;
    n  := coalesce(array_length(ps, 1), 0);
    continue when n > coalesce(array_length(segs, 1), 0);
    ok := true;
    for i in 1..n loop
      if ps[i] = '{self}' then
        if me = '' or segs[i] <> me then ok := false; exit; end if;
      elsif ps[i] <> segs[i] then ok := false; exit; end if;
    end loop;
    continue when not ok;
    continue when (op = 'read' and r.read_level is null) or (op = 'write' and r.write_level is null);
    if n > best then
      best := n;
      lvl  := case when op = 'read' then r.read_level else r.write_level end;
    end if;
  end loop;
  return coalesce(level_rank(lvl), case when op = 'read' then 1 else 3 end);
end $$;

create or replace function public.can(p text, op text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_level() > 0 and public.my_level() >= public.required_level(p, op)
$$;

alter table public.docs enable row level security;
drop policy if exists docs_read   on public.docs;
drop policy if exists docs_insert on public.docs;
drop policy if exists docs_update on public.docs;
drop policy if exists docs_delete on public.docs;
create policy docs_read   on public.docs for select using (public.can(path, 'read'));
create policy docs_insert on public.docs for insert with check (public.can(path, 'write'));
create policy docs_update on public.docs for update using (public.can(path, 'write')) with check (public.can(path, 'write'));
create policy docs_delete on public.docs for delete using (public.can(path, 'write'));
grant select, insert, update, delete on public.docs to authenticated;

-- Fusion profonde (update partiel d'un document, comme l'application l'attend)
create or replace function public.jsonb_deep_merge(a jsonb, b jsonb) returns jsonb
language plpgsql immutable as $$
declare k text; res jsonb;
begin
  if a is null or jsonb_typeof(a) <> 'object' or jsonb_typeof(b) <> 'object' then return b; end if;
  res := a;
  for k in select jsonb_object_keys(b) loop
    if res ? k and jsonb_typeof(res->k) = 'object' and jsonb_typeof(b->k) = 'object' then
      res := jsonb_set(res, array[k], public.jsonb_deep_merge(res->k, b->k));
    else
      res := jsonb_set(res, array[k], b->k);
    end if;
  end loop;
  return res;
end $$;

create or replace function public.doc_update(p_path text, p_patch jsonb) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare cur jsonb; res jsonb;
begin
  select data into cur from docs where path = p_path for update;
  if not found then
    insert into docs(path, data) values (p_path, p_patch) returning data into res;
  else
    update docs set data = jsonb_deep_merge(cur, p_patch) where path = p_path returning data into res;
    if res is null then raise exception 'permission denied' using errcode = '42501'; end if;
  end if;
  return res;
end $$;
grant execute on function public.doc_update(text, jsonb) to authenticated;

-- ---------- Comptes : création automatique du membre ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into members(uid, email, level) values (
    new.id, new.email,
    case when lower(coalesce(new.email, '')) = lower((select value from app_config where key = 'owner_email'))
         then 'owner'
         else coalesce((select value from app_config where key = 'default_level'), 'interact') end)
  on conflict (uid) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists members_read   on public.members;
drop policy if exists members_update on public.members;
create policy members_read   on public.members for select using (uid = auth.uid() or public.my_level() >= 4);
create policy members_update on public.members for update using (public.my_level() >= 4) with check (public.my_level() >= 4);
grant select, update on public.members to authenticated;

-- Un professeur ajouté par la prof principale (document staff/…) devient automatiquement « admin »
create or replace function public.sync_staff_level() returns trigger
language plpgsql security definer set search_path = public as $$
declare u uuid; d record;
begin
  d := case when tg_op = 'DELETE' then old else new end;
  if d.col <> 'staff' then return d; end if;
  begin u := d.id::uuid; exception when others then return d; end;
  if tg_op = 'DELETE' or coalesce(new.data->>'role', '') <> 'teacher' then
    update members set level = 'interact' where uid = u and level = 'admin';
  elsif new.data->>'role' = 'teacher' then
    update members set level = 'admin' where uid = u and level in ('view', 'interact');
  end if;
  return d;
end $$;
drop trigger if exists docs_staff on public.docs;
create trigger docs_staff after insert or update or delete on public.docs
  for each row execute function public.sync_staff_level();

-- ---------- Limite d'utilisation de l'IA ----------
create table if not exists public.ai_usage (
  uid uuid not null,
  day date not null default current_date,
  n   int  not null default 0,
  primary key (uid, day)
);
alter table public.ai_usage enable row level security;

create or replace function public.ai_take(p_uid uuid) returns int
language plpgsql security definer set search_path = public as $$
declare c int; lim int; lv int;
begin
  select level_rank(level) into lv from members where uid = p_uid;
  lim := (select value::int from app_config where key = case when coalesce(lv, 0) >= 3 then 'ai_daily_limit_teacher' else 'ai_daily_limit_student' end);
  insert into ai_usage(uid, day, n) values (p_uid, current_date, 1)
    on conflict (uid, day) do update set n = ai_usage.n + 1
    returning n into c;
  return case when c > coalesce(lim, 120) then -c else c end;
end $$;
revoke all on function public.ai_take(uuid) from public;

-- ---------- Temps réel ----------
alter table public.docs replica identity full;
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.docs;
    exception when duplicate_object then null; end;
  end if;
end $$;

-- ---------- Fichiers (photos d'épreuves, images des profs) ----------
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public) values ('assets', 'assets', true) on conflict (id) do nothing;
    drop policy if exists "assets_insert_teachers" on storage.objects;
    drop policy if exists "assets_delete_teachers" on storage.objects;
    create policy "assets_insert_teachers" on storage.objects for insert to authenticated
      with check (bucket_id = 'assets' and public.my_level() >= 3);
    create policy "assets_delete_teachers" on storage.objects for delete to authenticated
      using (bucket_id = 'assets' and public.my_level() >= 3);
  end if;
end $$;

-- Si la prof principale s'est inscrite AVANT d'avoir mis son e-mail plus haut :
--   update public.members set level = 'owner' where email = 'son-email@gmail.com';


-- =====================================================================
--  Verrou de l'XP : un élève ne peut plus se donner de l'XP à volonté.
--  À coller dans Supabase → SQL Editor → New query → Run (sans risque, relançable).
--  Règles pour un élève / un parent (les professeurs ne sont pas limités) :
--   1. son XP ne peut jamais baisser ;
--   2. un seul enregistrement ne peut pas ajouter plus de 'xp_max_per_write' XP ;
--   3. il ne peut pas gagner plus de 'xp_max_per_day' XP par jour ;
--   4. son XP au classement (board) ne peut pas dépasser son vrai XP.
--  Tout excès est simplement ramené à la limite (l'application ne plante pas).
-- =====================================================================

insert into public.app_config(key, value) values
  ('xp_max_per_write', '600'),
  ('xp_max_per_day',   '4000')
on conflict (key) do nothing;

create table if not exists public.xp_daily (
  uid    uuid not null,
  day    date not null default current_date,
  gained int  not null default 0,
  primary key (uid, day)
);
alter table public.xp_daily enable row level security;

create or replace function public.guard_student_xp() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  me text := auth.uid()::text;
  old_xp numeric := 0; new_xp numeric := 0; real_xp numeric := 0;
  gain numeric; allowed numeric; used int;
  per_write int := coalesce((select value::int from app_config where key = 'xp_max_per_write'), 600);
  per_day   int := coalesce((select value::int from app_config where key = 'xp_max_per_day'), 4000);
begin
  if me is null or public.my_level() >= 3 then return new; end if;   -- professeurs et serveur : libres

  if new.path = 'students/' || me then
    new_xp := coalesce((new.data->>'xp')::numeric, 0);
    if tg_op = 'UPDATE' then old_xp := coalesce((old.data->>'xp')::numeric, 0); end if;
    if new_xp < old_xp then new_xp := old_xp; end if;                 -- l'XP ne baisse pas
    gain := new_xp - old_xp;
    if gain > 0 then
      allowed := least(gain, per_write);
      select coalesce(gained, 0) into used from xp_daily where uid = auth.uid() and day = current_date;
      used := coalesce(used, 0);
      allowed := greatest(0, least(allowed, per_day - used));
      insert into xp_daily(uid, day, gained) values (auth.uid(), current_date, allowed)
        on conflict (uid, day) do update set gained = xp_daily.gained + allowed;
      new_xp := old_xp + allowed;
    end if;
    if new.data ? 'xp' or tg_op = 'INSERT' then
      new.data := jsonb_set(new.data, '{xp}', to_jsonb(new_xp::bigint));
    end if;

  elsif new.path = 'board/' || me then                                 -- classement
    select coalesce((data->>'xp')::numeric, 0) into real_xp from docs where path = 'students/' || me;
    real_xp := coalesce(real_xp, 0);
    if coalesce((new.data->>'xp')::numeric, 0) > real_xp then
      new.data := jsonb_set(new.data, '{xp}', to_jsonb(real_xp::bigint));
    end if;
  end if;
  return new;
end $$;

-- nom en « zz_ » : s'exécute après docs_fill
drop trigger if exists zz_docs_xp_guard on public.docs;
create trigger zz_docs_xp_guard before insert or update on public.docs
  for each row execute function public.guard_student_xp();
