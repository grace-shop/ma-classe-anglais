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

-- 9) Appels : entre élèves, seulement entre amis (duo, appel de groupe, ajout à un appel)
--    Les appels avec le professeur ne changent pas.
create or replace function public.need_friend(me uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_level() = 2
     and exists (select 1 from docs where path = 'students/' || u::text)
     and exists (select 1 from docs where path = 'students/' || me::text)
     and not public.is_friend(me, u)
$$;
revoke all on function public.need_friend(uuid, uuid) from public, anon;
grant execute on function public.need_friend(uuid, uuid) to authenticated;

create or replace function public.call_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks where (uid = a and blocked = b) or (uid = b and blocked = a))
      or (exists (select 1 from docs where path = 'students/' || a::text)
          and exists (select 1 from docs where path = 'students/' || b::text)
          and not public.is_friend(a, b))
$$;

-- 10) Groupes : on ne peut ajouter (ou inviter à la création) que ses amis
create or replace function public.create_group(p_name text, p_bio text, p_photo text, p_members uuid[]) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); nm text := btrim(coalesce(p_name, '')); bi text := btrim(coalesce(p_bio, '')); ph text; gid uuid; u uuid; n int := 0; names text := '';
begin
  if me is null or public.my_level() < 2 then raise exception 'Access denied'; end if;
  if not public.peer_enabled() and public.my_level() < 3 then raise exception 'Your teacher has turned off chat between students'; end if;
  if not public.group_can_act() then raise exception 'Chat is turned off for your account'; end if;
  if char_length(nm) < 1 then raise exception 'Give the group a name'; end if;
  if char_length(nm) > 60 then raise exception 'Group name too long (60 characters maximum)'; end if;
  if char_length(bi) > 200 then raise exception 'Description too long (200 characters maximum)'; end if;
  ph := public.group_photo(p_photo);
  if (select count(*) from chat_groups where created_by = me and created_at > now() - interval '1 day') >= 20 then raise exception 'You created too many groups today'; end if;
  if coalesce(array_length(p_members, 1), 0) > 99 then raise exception 'A group can have 100 members maximum'; end if;
  insert into chat_groups(name, bio, photo, created_by) values (nm, bi, ph, me) returning id into gid;
  insert into group_members(group_id, uid, role, who, added_by) values (gid, me, 'admin', public.feed_who(me), me);
  for u in select distinct x from unnest(coalesce(p_members, '{}'::uuid[])) x where x is not null and x <> me loop
    if not public.group_user_ok(u) then continue; end if;
    if public.need_friend(me, u) then continue; end if;
    if exists (select 1 from docs where path = 'students/' || u::text and data->>'peerOff' = 'true') then continue; end if;
    if exists (select 1 from blocks where (uid = u and blocked = me) or (uid = me and blocked = u)) then continue; end if;
    insert into group_members(group_id, uid, role, who, added_by) values (gid, u, 'member', public.feed_who(u), me) on conflict do nothing;
    n := n + 1;
  end loop;
  if n = 0 then raise exception 'Choose at least one member who can chat'; end if;
  perform public.group_sys(gid, me, public.group_name_of(me) || ' created the group “' || nm || '”');
  for u in select uid from group_members where group_id = gid and uid <> me loop
    perform public.notify(u, 'group_add', me, 'group:' || gid::text, nm);
  end loop;
  return gid;
end $$;

create or replace function public.add_group_members(p_id uuid, p_uids uuid[]) returns int
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g chat_groups; u uuid; n int := 0; total int; names text := '';
begin
  select * into g from chat_groups where id = p_id;
  if g.id is null or public.group_role(p_id) is distinct from 'admin' or not public.group_can_act() then raise exception 'Only group admins can add members'; end if;
  select count(*) into total from group_members where group_id = p_id;
  for u in select distinct x from unnest(coalesce(p_uids, '{}'::uuid[])) x where x is not null and x <> me loop
    if exists (select 1 from group_members where group_id = p_id and uid = u) then continue; end if;
    if not public.group_user_ok(u) then continue; end if;
    if public.need_friend(me, u) then continue; end if;
    if exists (select 1 from docs where path = 'students/' || u::text and data->>'peerOff' = 'true') then continue; end if;
    if exists (select 1 from blocks where (uid = u and blocked = me) or (uid = me and blocked = u)) then continue; end if;
    if total >= 100 then raise exception 'A group can have 100 members maximum'; end if;
    insert into group_members(group_id, uid, role, who, added_by) values (p_id, u, 'member', public.feed_who(u), me);
    total := total + 1; n := n + 1;
    names := names || case when n > 1 then ', ' else '' end || public.group_name_of(u);
    perform public.notify(u, 'group_add', me, 'group:' || p_id::text, g.name);
  end loop;
  if n > 0 then perform public.group_sys(p_id, me, public.group_name_of(me) || ' added ' || left(names, 300)); end if;
  return n;
end $$;

-- 11) Groupes et appels déjà existants : les élèves d'un même groupe deviennent amis
insert into public.friendships(sender, receiver, status, responded_at)
select distinct least(a.uid, b.uid), greatest(a.uid, b.uid), 'accepted', now()
from public.group_members a join public.group_members b on a.group_id = b.group_id and a.uid < b.uid
on conflict do nothing;
