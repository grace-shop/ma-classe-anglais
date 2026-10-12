-- =====================================================================
--  ARENA BATTLES : duels, battles à plusieurs, battle royale, défi du jour
--  À exécuter APRÈS supabase/arena.sql. Sans danger à relancer.
--   • duel      : 2 élèves, mêmes questions, le meilleur score gagne
--   • battle    : 2 à 8 élèves, classement en direct
--   • royale    : 2 à 12 élèves, une mauvaise réponse = éliminé, le dernier gagne
--   • challenge : défi du jour, chacun joue seul, un classement
-- =====================================================================

create table if not exists public.arena_rooms (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  kind       text not null check (kind in ('duel','battle','royale','challenge')),
  mode       text not null default 'quiz',
  qs         jsonb not null default '[]'::jsonb,
  host       uuid references auth.users(id) on delete cascade,
  status     text not null default 'lobby' check (status in ('lobby','playing','done')),
  started_at timestamptz,
  slot       int not null default 12,
  created_at timestamptz not null default now()
);
create table if not exists public.arena_players (
  room_id   uuid not null references public.arena_rooms(id) on delete cascade,
  uid       uuid not null references auth.users(id) on delete cascade,
  name      text not null default 'Student',
  alive     boolean not null default true,
  score     int not null default 0,
  joined_at timestamptz not null default now(),
  primary key (room_id, uid)
);
create table if not exists public.arena_answers (
  room_id uuid not null references public.arena_rooms(id) on delete cascade,
  uid     uuid not null references auth.users(id) on delete cascade,
  idx     int  not null,
  ok      boolean not null,
  pts     int not null default 0,
  at      timestamptz not null default now(),
  primary key (room_id, uid, idx)
);
alter table public.arena_rooms enable row level security;
alter table public.arena_players enable row level security;
alter table public.arena_answers enable row level security;
revoke all on public.arena_rooms, public.arena_players, public.arena_answers from anon, authenticated;

-- nom affiché d'un élève
create or replace function public.arena_my_name() returns text language sql security definer stable set search_path = public as $$
  select coalesce(nullif(btrim(d.data->>'name'), ''), 'Student') from docs d where d.path = 'students/' || auth.uid()::text
$$;

-- avance le salon : fin de partie, élimination (royale)
create or replace function public.arena_tick(p_room uuid) returns void language plpgsql security definer set search_path = public as $$
declare r public.arena_rooms; el numeric; cur int; n int; alive_n int;
begin
  select * into r from public.arena_rooms where id = p_room;
  if r.id is null or r.status <> 'playing' or r.kind = 'challenge' or r.started_at is null then return; end if;
  el := extract(epoch from (now() - r.started_at));
  if el < 0 then return; end if;
  n := jsonb_array_length(r.qs);
  cur := floor(el / r.slot)::int;
  if r.kind = 'royale' and cur >= 1 and cur - 1 < n then
    update public.arena_players p set alive = false
     where p.room_id = p_room and p.alive
       and not exists (select 1 from public.arena_answers a where a.room_id = p.room_id and a.uid = p.uid and a.idx = cur - 1);
  end if;
  if el >= n * r.slot + 3 then
    update public.arena_rooms set status = 'done' where id = p_room;
    return;
  end if;
  if r.kind = 'royale' then
    select count(*) into alive_n from public.arena_players where room_id = p_room and alive;
    if alive_n <= 1 then update public.arena_rooms set status = 'done' where id = p_room; end if;
  end if;
end $$;

-- crée un salon (duel, battle ou royale) ; renvoie son code à 6 lettres
create or replace function public.arena_create(p_kind text, p_mode text, p_qs jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c text; rid uuid; tries int := 0; chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if me is null then raise exception 'Sign in first'; end if;
  if p_kind not in ('duel','battle','royale') then raise exception 'Unknown battle'; end if;
  if jsonb_typeof(p_qs) <> 'array' or jsonb_array_length(p_qs) < 1 or jsonb_array_length(p_qs) > 20 then raise exception 'Bad questions'; end if;
  loop
    c := '';
    for i in 1..6 loop c := c || substr(chars, 1 + floor(random() * length(chars))::int, 1); end loop;
    exit when not exists (select 1 from public.arena_rooms where code = c);
    tries := tries + 1;
    if tries > 20 then raise exception 'Try again'; end if;
  end loop;
  insert into public.arena_rooms (code, kind, mode, qs, host, slot)
    values (c, p_kind, coalesce(p_mode, 'quiz'), p_qs, me, 12) returning id into rid;
  insert into public.arena_players (room_id, uid, name) values (rid, me, public.arena_my_name());
  return jsonb_build_object('id', rid, 'code', c);
end $$;

-- rejoindre un salon avec son code (avant le départ)
create or replace function public.arena_join(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.arena_rooms; cap int; cnt int;
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into r from public.arena_rooms where code = upper(btrim(p_code)) and kind <> 'challenge';
  if r.id is null then raise exception 'No battle with this code'; end if;
  if exists (select 1 from public.arena_players where room_id = r.id and uid = me) then return r.id; end if;
  if r.status <> 'lobby' then raise exception 'This battle has already started'; end if;
  cap := case r.kind when 'duel' then 2 when 'battle' then 8 else 12 end;
  select count(*) into cnt from public.arena_players where room_id = r.id;
  if cnt >= cap then raise exception 'This battle is full'; end if;
  insert into public.arena_players (room_id, uid, name) values (r.id, me, public.arena_my_name());
  return r.id;
end $$;

-- l'hôte lance la partie (5 s avant la première question)
create or replace function public.arena_start(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.arena_rooms; cnt int;
begin
  select * into r from public.arena_rooms where id = p_room;
  if r.id is null or r.host <> me then raise exception 'Only the host can start'; end if;
  if r.status <> 'lobby' then return; end if;
  select count(*) into cnt from public.arena_players where room_id = p_room;
  if cnt < 2 then raise exception 'You need at least 2 players'; end if;
  update public.arena_rooms set status = 'playing', started_at = now() + interval '5 seconds' where id = p_room;
end $$;

-- une réponse : une seule par question ; la question doit être celle du moment
create or replace function public.arena_answer(p_room uuid, p_idx int, p_ok boolean, p_pts int) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.arena_rooms; el numeric; cur int; p public.arena_players;
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into r from public.arena_rooms where id = p_room;
  if r.id is null then raise exception 'No battle'; end if;
  if r.status <> 'playing' then raise exception 'The battle is not running'; end if;
  if p_idx < 0 or p_idx >= jsonb_array_length(r.qs) then raise exception 'Bad question'; end if;
  select * into p from public.arena_players where room_id = p_room and uid = me;
  if p.room_id is null then raise exception 'You are not in this battle'; end if;
  if r.kind <> 'challenge' then
    el := extract(epoch from (now() - r.started_at));
    if el < 0 then raise exception 'Not started yet'; end if;
    cur := floor(el / r.slot)::int;
    if p_idx <> cur then raise exception 'Too late'; end if;
  end if;
  if r.kind = 'royale' and not p.alive then raise exception 'You are out'; end if;
  if not exists (select 1 from public.arena_answers where room_id = p_room and uid = me and idx = p_idx) then
    insert into public.arena_answers (room_id, uid, idx, ok, pts)
      values (p_room, me, p_idx, coalesce(p_ok, false), greatest(0, least(30, coalesce(p_pts, 0))));
    update public.arena_players
       set score = score + (case when p_ok then greatest(0, least(30, coalesce(p_pts, 0))) else 0 end),
           alive = alive and (r.kind <> 'royale' or coalesce(p_ok, false))
     where room_id = p_room and uid = me;
  end if;
end $$;

-- l'état du salon, rafraîchi à chaque instant ; le serveur donne l'heure exacte
create or replace function public.arena_state(p_room uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.arena_rooms; out jsonb;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not exists (select 1 from public.arena_players where room_id = p_room and uid = me) then raise exception 'You are not in this battle'; end if;
  perform public.arena_tick(p_room);
  select * into r from public.arena_rooms where id = p_room;
  select jsonb_build_object(
    'id', r.id, 'code', r.code, 'kind', r.kind, 'mode', r.mode, 'status', r.status,
    'qs', r.qs, 'slot', r.slot, 'host', r.host, 'me', me,
    'now', floor(extract(epoch from now()) * 1000),
    'started', case when r.started_at is null then null else floor(extract(epoch from r.started_at) * 1000) end,
    'players', (select coalesce(jsonb_agg(jsonb_build_object('uid', p.uid, 'name', p.name, 'alive', p.alive, 'score', p.score) order by p.score desc, p.joined_at), '[]'::jsonb)
                from public.arena_players p where p.room_id = r.id),
    'answered', (select coalesce(jsonb_agg(a.idx), '[]'::jsonb) from public.arena_answers a where a.room_id = r.id and a.uid = me)
  ) into out;
  return out;
end $$;

-- défi du jour : un salon par jour, chacun joue seul, puis classement
create or replace function public.arena_challenge(p_code text, p_qs jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); rid uuid;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if jsonb_typeof(p_qs) <> 'array' or jsonb_array_length(p_qs) < 1 or jsonb_array_length(p_qs) > 20 then raise exception 'Bad questions'; end if;
  select id into rid from public.arena_rooms where code = p_code;
  if rid is null then
    insert into public.arena_rooms (code, kind, mode, qs, host, status, started_at, slot)
      values (p_code, 'challenge', 'quiz', p_qs, me, 'playing', now(), 12) returning id into rid;
  end if;
  insert into public.arena_players (room_id, uid, name) values (rid, me, public.arena_my_name())
    on conflict (room_id, uid) do nothing;
  return jsonb_build_object('id', rid, 'code', p_code);
end $$;


-- quitter un salon tant qu'il n'a pas commencé
create or replace function public.arena_leave(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then return; end if;
  delete from public.arena_players p using public.arena_rooms r
   where p.room_id = p_room and p.uid = me and r.id = p.room_id and r.status = 'lobby' and r.host <> me;
end $$;

revoke all on function public.arena_my_name(), public.arena_tick(uuid), public.arena_create(text, text, jsonb),
  public.arena_join(text), public.arena_start(uuid), public.arena_answer(uuid, int, boolean, int),
  public.arena_state(uuid), public.arena_challenge(text, jsonb), public.arena_leave(uuid) from public, anon;
grant execute on function public.arena_create(text, text, jsonb), public.arena_join(text), public.arena_start(uuid),
  public.arena_answer(uuid, int, boolean, int), public.arena_state(uuid), public.arena_challenge(text, jsonb), public.arena_leave(uuid) to authenticated;
