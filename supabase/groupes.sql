-- =====================================================================
--  GROUP CHATS (like WhatsApp groups)
--  Run in Supabase > SQL Editor AFTER messagerie.sql and communaute.sql.
--  Safe to run again (idempotent).
--  Rules checked by the SERVER:
--   • students (chat allowed: peer_ok) and teachers can create a group; the creator is admin
--   • members: students allowed to chat (peer_ok) or teachers; nobody blocked (either way)
--     with the person who adds them; 100 members maximum
--   • admins: rename, description, photo, add / remove members, make admin
--   • messages: 4000 characters, 40 per minute, 3000 per day (as peer messages)
--   • attachments: sticker / voice / photo / file in the sender's own folder of the private
--     "chat" bucket; view once photos (each member can open them one time)
--   • delete for everyone (own messages) and view once photos: a copy stays for teachers
--     (table group_archive), like peer_archive
--   • members see the messages sent after they joined; teachers (my_level() >= 3) can read
--     every group for moderation
--   • a new message notifies every other member (public.notify, kind 'group')
-- =====================================================================

create table if not exists public.chat_groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  photo      text not null default '',
  bio        text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.chat_groups drop constraint if exists chat_groups_name_check;
alter table public.chat_groups add constraint chat_groups_name_check check (char_length(name) between 1 and 60);
alter table public.chat_groups drop constraint if exists chat_groups_bio_check;
alter table public.chat_groups add constraint chat_groups_bio_check check (char_length(bio) <= 200);
alter table public.chat_groups drop constraint if exists chat_groups_photo_check;
alter table public.chat_groups add constraint chat_groups_photo_check check (char_length(photo) <= 400);

create table if not exists public.group_members (
  group_id     uuid not null references public.chat_groups(id) on delete cascade,
  uid          uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member',
  who          jsonb not null default '{}'::jsonb,
  added_by     uuid,
  joined_at    timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  primary key (group_id, uid)
);
alter table public.group_members drop constraint if exists group_members_role_check;
alter table public.group_members add constraint group_members_role_check check (role in ('admin', 'member'));
create index if not exists group_members_uid_idx on public.group_members (uid);

create table if not exists public.group_messages (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.chat_groups(id) on delete cascade,
  sender     uuid references auth.users(id) on delete set null,
  who        jsonb not null default '{}'::jsonb,
  body       text not null default '',
  att        jsonb,
  meta       jsonb,
  react      jsonb,
  opened     jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.group_messages drop constraint if exists group_messages_body_check;
alter table public.group_messages add constraint group_messages_body_check check (char_length(body) <= 4000);
create index if not exists group_messages_group_idx on public.group_messages (group_id, created_at desc);
create index if not exists group_messages_sender_idx on public.group_messages (sender, created_at desc);

-- copy for teachers: deleted messages and view once photos
create table if not exists public.group_archive (
  id         uuid primary key default gen_random_uuid(),
  msg_id     uuid,
  group_id   uuid,
  sender     uuid,
  who        jsonb,
  body       text,
  att        jsonb,
  kind       text,
  sent_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists group_archive_msg_idx on public.group_archive (msg_id);

alter table public.chat_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;
alter table public.group_archive enable row level security;

-- ---------- helpers ----------
create or replace function public.is_group_member(p_group uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = p_group and uid = auth.uid())
$$;

-- can I read this group / this message (members: messages sent after they joined; teachers: everything)
create or replace function public.group_sees(p_group uuid, p_at timestamptz) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare j timestamptz;
begin
  if auth.uid() is null then return false; end if;
  select joined_at into j from group_members where group_id = p_group and uid = auth.uid();
  if j is not null and (p_at is null or p_at >= j) then return public.my_level() >= 2; end if;
  return public.my_level() >= 3;
end $$;

-- can this person be in a group (student allowed to chat, or teacher)
create or replace function public.group_user_ok(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.peer_ok(u) or exists (select 1 from members where uid = u and public.level_rank(level) >= 3)
$$;

-- can I use group chats right now
create or replace function public.group_can_act() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (public.my_level() >= 3 or (public.my_level() = 2 and public.peer_enabled() and public.peer_ok(auth.uid())))
$$;

create or replace function public.group_photo(p text) returns text
language plpgsql immutable as $$
declare x text := btrim(coalesce(p, ''));
begin
  if x = '' then return ''; end if;
  if char_length(x) > 400 then raise exception 'Invalid photo'; end if;
  if x ~ '^https://[^/]+/storage/v1/object/public/avatars/[^?#]+$' then return x; end if;
  if x ~ '^g:[0-9]{1,2}:.{1,16}$' then return x; end if;     -- generated default: gradient number + emoji
  raise exception 'Invalid photo';
end $$;

create or replace function public.group_sys(p_group uuid, p_actor uuid, p_text text) returns void
language sql security definer set search_path = public as $$
  insert into group_messages(group_id, sender, who, body, meta)
  values (p_group, p_actor, case when p_actor is null then '{}'::jsonb else public.feed_who(p_actor) end, left(p_text, 400), jsonb_build_object('sys', true));
$$;

create or replace function public.group_name_of(u uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(public.feed_who(u)->>'name', 'Someone')
$$;

-- ---------- row level security: read only, every write goes through the functions below ----------
drop policy if exists chat_groups_read on public.chat_groups;
create policy chat_groups_read on public.chat_groups for select to authenticated using (public.group_sees(id, null));
drop policy if exists group_members_read on public.group_members;
create policy group_members_read on public.group_members for select to authenticated using (public.group_sees(group_id, null));
drop policy if exists group_messages_read on public.group_messages;
create policy group_messages_read on public.group_messages for select to authenticated using (public.group_sees(group_id, created_at));
drop policy if exists group_archive_staff on public.group_archive;
create policy group_archive_staff on public.group_archive for select to authenticated using (public.my_level() >= 3);

revoke all on public.chat_groups, public.group_members, public.group_messages, public.group_archive from anon, authenticated;
grant select on public.chat_groups, public.group_members, public.group_messages, public.group_archive to authenticated;

-- ---------- create a group ----------
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

-- ---------- edit name, description, photo (admins); null = keep ----------
create or replace function public.update_group(p_id uuid, p_name text, p_bio text, p_photo text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g chat_groups; nm text; bi text; ph text;
begin
  select * into g from chat_groups where id = p_id;
  if g.id is null or public.group_role(p_id) is distinct from 'admin' or not public.group_can_act() then raise exception 'Only group admins can do this'; end if;
  nm := coalesce(btrim(p_name), g.name); bi := coalesce(btrim(p_bio), g.bio); ph := case when p_photo is null then g.photo else public.group_photo(p_photo) end;
  if char_length(nm) < 1 then raise exception 'Give the group a name'; end if;
  if char_length(nm) > 60 then raise exception 'Group name too long (60 characters maximum)'; end if;
  if char_length(bi) > 200 then raise exception 'Description too long (200 characters maximum)'; end if;
  update chat_groups set name = nm, bio = bi, photo = ph, updated_at = now() where id = p_id;
  if nm <> g.name then perform public.group_sys(p_id, me, public.group_name_of(me) || ' changed the group name to “' || nm || '”'); end if;
  if ph <> g.photo then perform public.group_sys(p_id, me, public.group_name_of(me) || ' changed the group photo'); end if;
  if bi <> g.bio then perform public.group_sys(p_id, me, public.group_name_of(me) || ' changed the group description'); end if;
end $$;

create or replace function public.group_role(p_group uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from group_members where group_id = p_group and uid = auth.uid()
$$;

-- ---------- add members (admins) ----------
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

-- ---------- remove a member (admins; teachers for moderation) ----------
create or replace function public.remove_group_member(p_id uuid, p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if p_uid = me then perform public.leave_group(p_id); return; end if;
  if not ((public.group_role(p_id) = 'admin' and public.group_can_act()) or public.my_level() >= 3) then raise exception 'Only group admins can remove members'; end if;
  if not exists (select 1 from group_members where group_id = p_id and uid = p_uid) then return; end if;
  delete from group_members where group_id = p_id and uid = p_uid;
  perform public.group_sys(p_id, me, public.group_name_of(me) || ' removed ' || public.group_name_of(p_uid));
  if not exists (select 1 from group_members where group_id = p_id and role = 'admin') then
    update group_members set role = 'admin' where group_id = p_id and uid = (select uid from group_members where group_id = p_id order by joined_at limit 1);
  end if;
end $$;

-- ---------- make / remove admin (admins) ----------
create or replace function public.set_group_admin(p_id uuid, p_uid uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); cur text;
begin
  if public.group_role(p_id) is distinct from 'admin' or not public.group_can_act() then raise exception 'Only group admins can do this'; end if;
  select role into cur from group_members where group_id = p_id and uid = p_uid;
  if cur is null then raise exception 'This person is not in the group'; end if;
  if p_on and cur <> 'admin' then
    update group_members set role = 'admin' where group_id = p_id and uid = p_uid;
    perform public.group_sys(p_id, me, public.group_name_of(me) || ' made ' || public.group_name_of(p_uid) || ' an admin');
  elsif not p_on and cur = 'admin' then
    if (select count(*) from group_members where group_id = p_id and role = 'admin') <= 1 then raise exception 'A group needs at least one admin'; end if;
    update group_members set role = 'member' where group_id = p_id and uid = p_uid;
  end if;
end $$;

-- ---------- leave (if the last admin leaves, the oldest member becomes admin) ----------
create or replace function public.leave_group(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or not exists (select 1 from group_members where group_id = p_id and uid = me) then return; end if;
  delete from group_members where group_id = p_id and uid = me;
  if not exists (select 1 from group_members where group_id = p_id) then
    delete from chat_groups where id = p_id;     -- nobody left: the group is deleted
    return;
  end if;
  perform public.group_sys(p_id, me, public.group_name_of(me) || ' left');
  if not exists (select 1 from group_members where group_id = p_id and role = 'admin') then
    update group_members set role = 'admin' where group_id = p_id and uid = (select uid from group_members where group_id = p_id order by joined_at, uid limit 1);
  end if;
end $$;

-- ---------- send a message ----------
create or replace function public.send_group_message(p_group uuid, p_body text, p_att jsonb, p_meta jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); b text := btrim(coalesce(p_body, '')); n int; id uuid; k text; a jsonb := null; once jsonb := null; mt jsonb := null;
begin
  if me is null or public.my_level() < 2 then raise exception 'Access denied'; end if;
  if not exists (select 1 from group_members where group_id = p_group and uid = me) then raise exception 'You are not a member of this group'; end if;
  if public.my_level() = 2 and not public.peer_enabled() then raise exception 'Your teacher has turned off chat between students'; end if;
  if not public.group_can_act() then raise exception 'Chat is turned off for your account'; end if;
  if p_att is not null and jsonb_typeof(p_att) = 'object' then
    k := p_att->>'k';
    if k = 'sticker' then
      if coalesce(p_att->>'e', '') ~ '^[0-9a-f-]{2,60}$' then
        a := jsonb_build_object('k', 'sticker', 'e', p_att->>'e');
      elsif coalesce(p_att->>'p', '') like me::text || '/%' then
        -- own sticker (photo, GIF or short video) kept in the sender's folder
        a := jsonb_build_object('k', 'sticker', 'p', p_att->>'p', 't', left(coalesce(p_att->>'t', ''), 120));
      else raise exception 'Invalid sticker'; end if;
    elsif k in ('voice', 'img', 'file') then
      if coalesce(p_att->>'p', '') not like me::text || '/%' then raise exception 'Invalid file'; end if;
      a := jsonb_build_object('k', k, 'p', p_att->>'p', 't', left(coalesce(p_att->>'t', ''), 120), 'n', left(coalesce(p_att->>'n', ''), 80),
                              's', coalesce((p_att->>'s')::bigint, 0), 'd', coalesce((p_att->>'d')::int, 0));
      if k = 'img' and coalesce(p_att->>'o', '') in ('true', '1') then
        once := a || jsonb_build_object('o', true);
        a := jsonb_build_object('k', 'img', 'o', true);       -- the file path stays hidden: each member opens it with open_group_once
        b := '';
      end if;
    else raise exception 'Invalid attachment'; end if;
  end if;
  if char_length(b) < 1 and a is null then raise exception 'Empty message'; end if;
  if char_length(b) > 4000 then raise exception 'Message too long (4000 characters maximum)'; end if;
  if p_meta is not null and jsonb_typeof(p_meta) = 'object' and jsonb_typeof(p_meta->'re') = 'object' then
    mt := jsonb_build_object('re', jsonb_build_object('id', left(coalesce(p_meta->'re'->>'id', ''), 40), 't', left(coalesce(p_meta->'re'->>'t', ''), 140), 'w', left(coalesce(p_meta->'re'->>'w', ''), 40)));
  end if;
  select count(*) into n from group_messages where sender = me and created_at > now() - interval '1 minute' and not coalesce(meta ? 'sys', false);
  if n >= 40 then raise exception 'You are writing too fast: wait one minute'; end if;
  select count(*) into n from group_messages where sender = me and created_at > now() - interval '1 day' and not coalesce(meta ? 'sys', false);
  if n >= 3000 then raise exception 'Daily message limit reached'; end if;
  insert into group_messages(group_id, sender, who, body, att, meta) values (p_group, me, public.feed_who(me), b, a, mt) returning group_messages.id into id;
  if once is not null then
    insert into group_archive(msg_id, group_id, sender, who, body, att, kind, sent_at) values (id, p_group, me, public.feed_who(me), '', once, 'once', now());
  end if;
  update group_members set last_read_at = now() where group_id = p_group and uid = me;
  return id;
end $$;

-- ---------- delete for everyone (own messages; teachers can remove any message) ----------
create or replace function public.delete_group_message(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare m group_messages;
begin
  select * into m from group_messages where id = p_id;
  if m.id is null or coalesce(m.meta ? 'sys', false) then raise exception 'Access denied'; end if;
  if not ((m.sender = auth.uid() and public.my_level() >= 2) or public.my_level() >= 3) then raise exception 'Access denied'; end if;
  if m.deleted_at is not null then return; end if;
  if not coalesce(m.att ? 'o', false) then
    insert into group_archive(msg_id, group_id, sender, who, body, att, kind, sent_at) values (m.id, m.group_id, m.sender, m.who, m.body, m.att, 'deleted', m.created_at);
  else
    update group_archive set kind = 'once-deleted' where msg_id = m.id and kind = 'once';
  end if;
  update group_messages set body = '', att = null, meta = null, react = null, deleted_at = now() where id = p_id;
end $$;

-- ---------- reaction ('' removes it) ----------
create or replace function public.react_group_message(p_id uuid, p_e text) returns void
language plpgsql security definer set search_path = public as $$
declare m group_messages; me uuid := auth.uid(); e text := left(coalesce(p_e, ''), 16);
begin
  select * into m from group_messages where id = p_id;
  if m.id is null or m.deleted_at is not null or coalesce(m.meta ? 'sys', false) or public.my_level() < 2
     or not exists (select 1 from group_members where group_id = m.group_id and uid = me) then raise exception 'Access denied'; end if;
  if e = '' then update group_messages set react = coalesce(react, '{}'::jsonb) - me::text where id = p_id;
  else update group_messages set react = coalesce(react, '{}'::jsonb) || jsonb_build_object(me::text, e) where id = p_id; end if;
end $$;

-- ---------- open a view once photo (each member, one time) ----------
create or replace function public.open_group_once(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare m group_messages; me uuid := auth.uid(); a jsonb;
begin
  select * into m from group_messages where id = p_id;
  if m.id is null or public.my_level() < 2 or not exists (select 1 from group_members where group_id = m.group_id and uid = me) then raise exception 'Access denied'; end if;
  if m.sender = me or m.deleted_at is not null or coalesce(m.att->>'o', '') <> 'true' or (m.opened ? me::text) then return null; end if;
  select att into a from group_archive where msg_id = m.id and kind = 'once' order by created_at limit 1;
  update group_messages set opened = coalesce(opened, '{}'::jsonb) || jsonb_build_object(me::text, extract(epoch from now())::bigint) where id = p_id;
  return a;
end $$;

-- ---------- read ----------
create or replace function public.mark_group_read(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update group_members set last_read_at = now() where group_id = p_id and uid = auth.uid();
$$;

-- ---------- my groups with last message and unread count ----------
drop function if exists public.my_groups();
create or replace function public.my_groups() returns table(id uuid, name text, photo text, bio text, created_by uuid, created_at timestamptz, updated_at timestamptz,
  role text, joined_at timestamptz, last_read_at timestamptz, members int, last jsonb, unread int)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or public.my_level() < 2 then return; end if;
  return query
    select g.id, g.name, g.photo, g.bio, g.created_by, g.created_at, g.updated_at, gm.role, gm.joined_at, gm.last_read_at,
      (select count(*)::int from group_members x where x.group_id = g.id),
      (select jsonb_build_object('id', m.id, 'sender', m.sender, 'who', m.who, 'body', left(m.body, 300), 'att', m.att, 'meta', m.meta, 'deleted_at', m.deleted_at, 'created_at', m.created_at)
         from group_messages m where m.group_id = g.id and m.created_at >= gm.joined_at order by m.created_at desc limit 1),
      (select count(*)::int from (select 1 from group_messages m where m.group_id = g.id and m.created_at > gm.last_read_at and m.sender is distinct from me
         and m.deleted_at is null and not coalesce(m.meta ? 'sys', false) limit 100) u)
    from group_members gm join chat_groups g on g.id = gm.group_id
    where gm.uid = me
    order by g.updated_at desc;
end $$;

-- ---------- notification for every other member ----------
create or replace function public.trg_notif_group() returns trigger
language plpgsql security definer set search_path = public as $$
declare u uuid; b text;
begin
  if coalesce(new.meta ? 'sys', false) then return new; end if;
  b := case when coalesce(new.body, '') <> '' then new.body when new.att->>'k' = 'voice' then '🎤 Voice message' when new.att->>'k' = 'img' then '📷 Photo'
            when new.att->>'k' = 'sticker' then 'Sticker' else '📎 File' end;
  for u in select uid from group_members where group_id = new.group_id and uid is distinct from new.sender loop
    perform public.notify(u, 'group', new.sender, 'group:' || new.group_id::text, b);
  end loop;
  update chat_groups set updated_at = now() where id = new.group_id;
  return new;
end $$;
drop trigger if exists notif_group on public.group_messages;
create trigger notif_group after insert on public.group_messages for each row execute function public.trg_notif_group();

-- ---------- rights ----------
revoke all on function public.group_user_ok(uuid), public.group_can_act(), public.group_photo(text), public.group_sys(uuid, uuid, text), public.group_name_of(uuid), public.trg_notif_group() from public, anon, authenticated;
revoke all on function public.is_group_member(uuid), public.group_sees(uuid, timestamptz), public.group_role(uuid) from public, anon;
grant execute on function public.is_group_member(uuid), public.group_sees(uuid, timestamptz), public.group_role(uuid) to authenticated;
revoke all on function public.create_group(text, text, text, uuid[]), public.update_group(uuid, text, text, text), public.add_group_members(uuid, uuid[]),
  public.remove_group_member(uuid, uuid), public.set_group_admin(uuid, uuid, boolean), public.leave_group(uuid),
  public.send_group_message(uuid, text, jsonb, jsonb), public.delete_group_message(uuid), public.react_group_message(uuid, text),
  public.open_group_once(uuid), public.mark_group_read(uuid), public.my_groups() from public, anon;
grant execute on function public.create_group(text, text, text, uuid[]), public.update_group(uuid, text, text, text), public.add_group_members(uuid, uuid[]),
  public.remove_group_member(uuid, uuid), public.set_group_admin(uuid, uuid, boolean), public.leave_group(uuid),
  public.send_group_message(uuid, text, jsonb, jsonb), public.delete_group_message(uuid), public.react_group_message(uuid, text),
  public.open_group_once(uuid), public.mark_group_read(uuid), public.my_groups() to authenticated;

-- ---------- realtime ----------
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.group_messages; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.group_members; exception when duplicate_object then null; end;
  end if;
end $$;
