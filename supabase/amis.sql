-- =====================================================================
--  AMIS ENTRE ÉLÈVES (comme Facebook / Snapchat / Instagram)
--  À exécuter une fois dans Supabase > SQL Editor, APRÈS messagerie.sql et communaute.sql.
--
--  • Un élève envoie une demande d'ami à un camarade.
--  • Le camarade peut accepter ou refuser.
--  • Une fois accepté, ils deviennent amis et peuvent discuter.
--  • Sans amitié, personne ne peut écrire (la règle est vérifiée par la base,
--    donc aucune version de l'application ne peut la contourner).
--  • Les conversations déjà existantes restent : leurs deux élèves deviennent amis.
-- =====================================================================

-- 1) Table des demandes et des amitiés (une seule ligne par paire d'élèves)
create table if not exists public.friendships (
  sender       uuid not null references auth.users(id) on delete cascade,
  receiver     uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  primary key (sender, receiver),
  check (sender <> receiver)
);
create unique index if not exists friendships_pair_idx
  on public.friendships (least(sender, receiver), greatest(sender, receiver));
create index if not exists friendships_receiver_idx on public.friendships (receiver, status);

alter table public.friendships enable row level security;
drop policy if exists friendships_read on public.friendships;
create policy friendships_read on public.friendships for select to authenticated
  using (auth.uid() in (sender, receiver) or public.my_level() >= 3);
revoke all on public.friendships from anon, authenticated;
grant select on public.friendships to authenticated;

-- 2) Deux élèves sont-ils amis ?
create or replace function public.is_friend(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.friendships
                 where status = 'accepted'
                   and least(sender, receiver) = least(a, b) and greatest(sender, receiver) = greatest(a, b))
$$;
revoke all on function public.is_friend(uuid, uuid) from public, anon;
grant execute on function public.is_friend(uuid, uuid) to authenticated;

-- 3) Envoyer une demande (ou accepter celle qu'on a déjà reçue)
create or replace function public.friend_request(p_to uuid) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.friendships%rowtype; n int; nm text;
begin
  if me is null or public.my_level() <> 2 or not public.peer_enabled() or not public.peer_ok(me) then raise exception 'Friend requests are not available for your account'; end if;
  if p_to is null or p_to = me then raise exception 'You cannot add yourself'; end if;
  if not public.peer_ok(p_to) then raise exception 'This student cannot be added'; end if;
  if exists (select 1 from blocks where (uid = p_to and blocked = me) or (uid = me and blocked = p_to)) then raise exception 'You cannot add this person'; end if;

  select * into r from friendships where least(sender, receiver) = least(me, p_to) and greatest(sender, receiver) = greatest(me, p_to);
  if found then
    if r.status = 'accepted' then return 'friends'; end if;
    if r.sender = me then return 'pending'; end if;
    -- il m'avait déjà demandé : on accepte directement
    update friendships set status = 'accepted', responded_at = now() where sender = r.sender and receiver = r.receiver;
    select coalesce(data->>'name', '') into nm from docs where path = 'students/' || me::text;
    perform public.notify(p_to, 'friend_ok', me, 'friend:' || me::text, coalesce(nm, ''));
    return 'friends';
  end if;

  select count(*) into n from friendships where sender = me and created_at > now() - interval '1 day';
  if n >= 30 then raise exception 'Too many friend requests today'; end if;
  select count(*) into n from friendships where sender = me and status = 'pending';
  if n >= 100 then raise exception 'You have too many pending requests'; end if;

  insert into friendships(sender, receiver, status) values (me, p_to, 'pending');
  select coalesce(data->>'name', '') into nm from docs where path = 'students/' || me::text;
  perform public.notify(p_to, 'friend_req', me, 'friend:' || me::text, coalesce(nm, ''));
  return 'sent';
end $$;

-- 4) Accepter ou refuser une demande reçue
create or replace function public.friend_respond(p_from uuid, p_accept boolean) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); nm text;
begin
  if me is null or public.my_level() <> 2 then raise exception 'Access denied'; end if;
  if not exists (select 1 from friendships where sender = p_from and receiver = me and status = 'pending') then
    raise exception 'This request no longer exists';
  end if;
  if p_accept then
    update friendships set status = 'accepted', responded_at = now() where sender = p_from and receiver = me;
    select coalesce(data->>'name', '') into nm from docs where path = 'students/' || me::text;
    perform public.notify(p_from, 'friend_ok', me, 'friend:' || me::text, coalesce(nm, ''));
    return 'friends';
  end if;
  -- refus : la demande disparaît, sans prévenir l'autre élève
  delete from friendships where sender = p_from and receiver = me and status = 'pending';
  return 'refused';
end $$;

-- 5) Annuler une demande envoyée, ou retirer un ami
create or replace function public.friend_remove(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Access denied'; end if;
  delete from friendships where least(sender, receiver) = least(me, p_uid) and greatest(sender, receiver) = greatest(me, p_uid);
end $$;

-- 6) Ma liste : amis, demandes reçues et envoyées
drop function if exists public.friend_list();
create or replace function public.friend_list() returns table(uid uuid, status text, incoming boolean, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select case when f.sender = auth.uid() then f.receiver else f.sender end,
         f.status,
         (f.receiver = auth.uid() and f.status = 'pending'),
         f.created_at
  from public.friendships f
  where auth.uid() in (f.sender, f.receiver) and public.my_level() = 2
  order by f.created_at desc
  limit 1000
$$;

revoke all on function public.friend_request(uuid), public.friend_respond(uuid, boolean), public.friend_remove(uuid), public.friend_list() from public, anon;
grant execute on function public.friend_request(uuid), public.friend_respond(uuid, boolean), public.friend_remove(uuid), public.friend_list() to authenticated;

-- 7) Règle de base : un élève ne peut écrire qu'à un ami
--    (vérifiée par un déclencheur : aucune ancienne version de l'application ne la contourne)
create or replace function public.trg_peer_friends() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.my_level() = 2 and not public.is_friend(new.sender, new.receiver) then
    raise exception 'You must be friends to write to this person. Send a friend request first.';
  end if;
  return new;
end $$;
drop trigger if exists peer_friends_only on public.peer_messages;
create trigger peer_friends_only before insert on public.peer_messages
  for each row execute function public.trg_peer_friends();

-- 8) Conversations déjà existantes : leurs élèves deviennent amis (personne ne perd son chat)
insert into public.friendships(sender, receiver, status, responded_at)
select distinct least(sender, receiver), greatest(sender, receiver), 'accepted', now()
from public.peer_messages
where sender <> receiver
on conflict do nothing;
