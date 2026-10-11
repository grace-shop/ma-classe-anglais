-- =====================================================================
-- English Classes · appels (voix, vidéo, à deux ou en groupe)
-- À exécuter APRÈS messagerie.sql et groupes.sql. Idempotent.
-- Signalisation : table call_signals (offres, réponses, candidats réseau) lue en temps réel.
-- Règles : seuls les élèves autorisés (peer_ok) ou les membres du groupe peuvent appeler,
-- les blocages sont respectés, et on ne reçoit que les signaux qui nous sont adressés.
-- =====================================================================

create table if not exists public.calls (
  id         uuid primary key default gen_random_uuid(),
  host       uuid not null references auth.users(id) on delete cascade,
  kind       text not null default 'duo' check (kind in ('duo', 'group')),
  group_id   uuid references public.chat_groups(id) on delete cascade,
  video      boolean not null default false,
  members    uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  ended_at   timestamptz
);
alter table public.calls enable row level security;
drop policy if exists calls_read on public.calls;
create policy calls_read on public.calls for select to authenticated
  using (host = auth.uid() or auth.uid() = any(members));
revoke all on public.calls from anon, authenticated;
grant select on public.calls to authenticated;

create table if not exists public.call_signals (
  id         bigserial primary key,
  call_id    uuid not null references public.calls(id) on delete cascade,
  from_uid   uuid not null references auth.users(id) on delete cascade,
  to_uid     uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('ring', 'join', 'offer', 'answer', 'ice', 'leave', 'decline', 'end')),
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists call_signals_to on public.call_signals (to_uid, id);
alter table public.call_signals enable row level security;
drop policy if exists call_signals_read on public.call_signals;
create policy call_signals_read on public.call_signals for select to authenticated
  using (to_uid = auth.uid());
drop policy if exists call_signals_write on public.call_signals;
create policy call_signals_write on public.call_signals for insert to authenticated
  with check (
    from_uid = auth.uid()
    and exists (
      select 1 from public.calls c
      where c.id = call_id
        and (c.host = auth.uid() or auth.uid() = any(c.members))
        and (c.host = to_uid or to_uid = any(c.members))
    )
  );
revoke all on public.call_signals from anon, authenticated;
grant select, insert on public.call_signals to authenticated;
grant usage on sequence public.call_signals_id_seq to authenticated;

-- Can this person take part in a call (student allowed to chat, or teacher; in a group: a member)?
create or replace function public.call_can_join(p_group uuid, u uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  if u is null then return false; end if;
  if p_group is not null then
    return exists (select 1 from group_members where group_id = p_group and uid = u) and public.group_user_ok(u);
  end if;
  return public.peer_ok(u);
end $$;

-- Blocked in either direction?
create or replace function public.call_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks where (uid = a and blocked = b) or (uid = b and blocked = a))
$$;

-- Start a call: p_kind 'duo' (one other person) or 'group' (several people, or a group chat)
create or replace function public.start_call(p_kind text, p_group uuid, p_video boolean, p_uids uuid[]) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); cid uuid; ok uuid[] := '{}'; u uuid;
begin
  if me is null then raise exception 'Log in first'; end if;
  if p_kind not in ('duo', 'group') then raise exception 'Unknown call type'; end if;
  if not public.call_can_join(p_group, me) then raise exception 'Calls are turned off for your account'; end if;
  foreach u in array coalesce(p_uids, '{}') loop
    continue when u is null or u = me or u = any(ok);
    if not public.call_can_join(p_group, u) then raise exception 'One of these people cannot take part in calls'; end if;
    if public.call_blocked(me, u) then raise exception 'You cannot call this person'; end if;
    ok := ok || u;
  end loop;
  if coalesce(array_length(ok, 1), 0) = 0 then raise exception 'Choose at least one person'; end if;
  if p_kind = 'duo' and array_length(ok, 1) <> 1 then raise exception 'A two-person call is with one other person'; end if;
  if array_length(ok, 1) > 7 then raise exception 'A call can have at most 8 people'; end if;
  insert into public.calls (host, kind, group_id, video, members)
    values (me, case when p_group is not null or array_length(ok, 1) > 1 then 'group' else 'duo' end, p_group, coalesce(p_video, false), ok)
    returning id into cid;
  return cid;
end $$;

-- Add someone to a call that is already running (it becomes a group call)
create or replace function public.call_add(p_call uuid, p_uids uuid[]) returns uuid[]
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c public.calls%rowtype; u uuid; added uuid[] := '{}';
begin
  select * into c from public.calls where id = p_call;
  if c.id is null or c.ended_at is not null then raise exception 'This call is over'; end if;
  if not (c.host = me or me = any(c.members)) then raise exception 'You are not in this call'; end if;
  if array_length(c.members, 1) + 1 + coalesce(array_length(p_uids, 1), 0) > 8 then raise exception 'A call can have at most 8 people'; end if;
  foreach u in array coalesce(p_uids, '{}') loop
    continue when u is null or u = me or u = any(c.members) or u = c.host;
    if not public.call_can_join(c.group_id, u) then raise exception 'One of these people cannot take part in calls'; end if;
    if public.call_blocked(me, u) then raise exception 'You cannot call this person'; end if;
    added := added || u;
  end loop;
  update public.calls
    set members = members || added, kind = 'group'
    where id = p_call;
  return added;
end $$;

-- End the call for everyone (the host) or leave it (anyone else); signals are then cleaned up
create or replace function public.end_call(p_call uuid, p_leave boolean) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c public.calls%rowtype;
begin
  select * into c from public.calls where id = p_call;
  if c.id is null then return; end if;
  if not (c.host = me or me = any(c.members)) then raise exception 'You are not in this call'; end if;
  if c.host = me and not coalesce(p_leave, false) then
    update public.calls set ended_at = now() where id = p_call;
    delete from public.call_signals where call_id = p_call;
  elsif c.host <> me and c.ended_at is null then
    update public.calls set members = array_remove(members, me) where id = p_call;
  end if;
end $$;

revoke all on function public.call_can_join(uuid, uuid), public.call_blocked(uuid, uuid) from public, anon;
grant execute on function public.start_call(text, uuid, boolean, uuid[]) to authenticated;
grant execute on function public.call_add(uuid, uuid[]) to authenticated;
grant execute on function public.end_call(uuid, boolean) to authenticated;

-- Live: calls reach the other people's screens at once (each person only receives their own signals)
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.call_signals;
    exception when duplicate_object then null; end;
  end if;
end $$;
