-- Jeux à distance (échecs, ludo, moulin à 3 pions) par invitation entre camarades (v104)
-- À exécuter une fois dans l'éditeur SQL de Supabase.

create table if not exists public.game_matches (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('chess', 'ludo', 'morris', 'ttt')),
  host uuid not null,
  guest uuid not null,
  status text not null default 'invited' check (status in ('invited', 'playing', 'over', 'declined')),
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.game_matches enable row level security;
drop policy if exists game_matches_read on public.game_matches;
create policy game_matches_read on public.game_matches for select
  using (auth.uid() = host or auth.uid() = guest);

-- inviter un camarade (il doit être ami, comme pour la messagerie)
create or replace function public.game_invite(p_to uuid, p_kind text, p_state jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); id uuid;
begin
  if me is null or p_to is null or p_to = me then raise exception 'Access denied'; end if;
  if p_kind not in ('chess', 'ludo', 'morris', 'ttt') then raise exception 'Unknown game'; end if;
  if not public.peer_ok(p_to) then raise exception 'You can only invite a classmate who accepts messages'; end if;
  insert into game_matches (kind, host, guest, status, state) values (p_kind, me, p_to, 'invited', p_state) returning game_matches.id into id;
  return id;
end $$;
grant execute on function public.game_invite(uuid, text, jsonb) to authenticated;

-- accepter ou refuser (seul l'invité)
create or replace function public.game_respond(p_id uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update game_matches set status = case when p_accept then 'playing' else 'declined' end, updated_at = now()
   where id = p_id and guest = auth.uid() and status = 'invited';
  if not found then raise exception 'Access denied'; end if;
end $$;
grant execute on function public.game_respond(uuid, boolean) to authenticated;

-- envoyer un coup : l'état complet est remplacé (les deux joueurs le relisent)
create or replace function public.game_play(p_id uuid, p_state jsonb, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('playing', 'over') then raise exception 'Bad status'; end if;
  update game_matches set state = p_state, status = p_status, updated_at = now()
   where id = p_id and status = 'playing' and auth.uid() in (host, guest);
  if not found then raise exception 'Access denied'; end if;
end $$;
grant execute on function public.game_play(uuid, jsonb, text) to authenticated;

-- mes invitations en attente et mes parties en cours
create or replace function public.game_list() returns setof game_matches
language sql stable security definer set search_path = public as $$
  select * from game_matches
   where auth.uid() in (host, guest) and status in ('invited', 'playing') and updated_at > now() - interval '3 days'
   order by updated_at desc limit 30;
$$;
grant execute on function public.game_list() to authenticated;
