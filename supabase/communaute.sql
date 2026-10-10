-- =====================================================================
--  COMMUNITY : publications (fil d'actualité) et stories de 24 h
--  À exécuter dans Supabase > SQL Editor, APRÈS messagerie.sql
--  (peut être relancé sans risque).
--  Règles appliquées par le SERVEUR :
--   • publient et voient : les élèves actifs de l'école (comme le chat entre
--     élèves : pas les parents, pas le primaire) et les professeurs
--   • publications : 4000 caractères, 4 photos ou vidéos (50 Mo), 30 par jour ; partage de publications
--   • réactions (j'aime…) sur les publications et les stories
--   • NOTIFICATIONS : messages, commentaires, réactions, réponses aux stories
--   • commentaires : 1000 caractères, 300 par jour ; stories : 40 par jour
--   • chacun supprime ses publications ; les professeurs peuvent tout supprimer
--     (une publication supprimée reste visible par les professeurs)
--   • réglage général : settings/main → feed = false coupe la Community des élèves
-- =====================================================================

create or replace function public.feed_enabled() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select data->>'feed' from docs where path = 'settings/main'), 'true') <> 'false'
$$;

-- qui peut voir et publier
create or replace function public.feed_ok() returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_level() >= 3 or (public.my_level() = 2 and public.feed_enabled() and public.peer_ok(auth.uid()))
$$;

-- nom et photo de l'auteur, lus par le serveur (on ne peut pas se faire passer pour un autre)
create or replace function public.feed_who(u uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare d jsonb;
begin
  select data into d from docs where path = 'students/' || u::text;
  if d is not null then
    return jsonb_build_object('name', coalesce(d->>'name', 'Student'), 'photo', d->>'photo', 'ava', d->>'ava', 'classe', coalesce(d->>'classe', ''), 'role', 'student');
  end if;
  select data into d from docs where path = 'staff/' || u::text;
  return jsonb_build_object('name', coalesce(d->>'name', 'Teacher'), 'photo', d->>'photo', 'role', 'teacher');
end $$;

create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  author     uuid not null references auth.users(id) on delete cascade,
  who        jsonb not null default '{}'::jsonb,
  body       text not null default '' check (char_length(body) <= 4000),
  media      jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid
);
alter table public.posts add column if not exists shared jsonb;
create index if not exists posts_time_idx on public.posts (created_at desc);

create table if not exists public.post_likes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  uid        uuid not null references auth.users(id) on delete cascade,
  e          text not null default '❤️',
  created_at timestamptz not null default now(),
  primary key (post_id, uid)
);

create table if not exists public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author     uuid not null references auth.users(id) on delete cascade,
  who        jsonb not null default '{}'::jsonb,
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);

create table if not exists public.stories (
  id         uuid primary key default gen_random_uuid(),
  author     uuid not null references auth.users(id) on delete cascade,
  who        jsonb not null default '{}'::jsonb,
  media      jsonb,
  body       text not null default '' check (char_length(body) <= 300),
  bg         text not null default '',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists stories_time_idx on public.stories (created_at desc);

create table if not exists public.story_views (
  story_id uuid not null references public.stories(id) on delete cascade,
  uid      uuid not null references auth.users(id) on delete cascade,
  who      jsonb not null default '{}'::jsonb,
  at       timestamptz not null default now(),
  primary key (story_id, uid)
);

alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;

drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated
  using (public.feed_ok() and (deleted_at is null or public.my_level() >= 3));
drop policy if exists likes_read on public.post_likes;
create policy likes_read on public.post_likes for select to authenticated using (public.feed_ok());
drop policy if exists comments_read on public.post_comments;
create policy comments_read on public.post_comments for select to authenticated
  using (public.feed_ok() and (deleted_at is null or public.my_level() >= 3));
drop policy if exists stories_read on public.stories;
create policy stories_read on public.stories for select to authenticated
  using (public.feed_ok() and ((deleted_at is null and created_at > now() - interval '24 hours')
                               or (public.my_level() >= 3 and created_at > now() - interval '14 days')));
drop policy if exists story_views_read on public.story_views;
create policy story_views_read on public.story_views for select to authenticated
  using (uid = auth.uid() or public.my_level() >= 3
         or exists (select 1 from public.stories s where s.id = story_id and s.author = auth.uid()));

revoke all on public.posts, public.post_likes, public.post_comments, public.stories, public.story_views from anon, authenticated;
grant select on public.posts, public.post_likes, public.post_comments, public.stories, public.story_views to authenticated;

-- photos : dans le dossier privé « chat », chacun dans son propre dossier
create or replace function public.feed_media(p jsonb, maxn int) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb := '[]'::jsonb; x jsonb; n int := 0;
begin
  if p is null or jsonb_typeof(p) <> 'array' then return null; end if;
  for x in select * from jsonb_array_elements(p) loop
    n := n + 1; exit when n > maxn;
    if coalesce(x->>'p', '') not like auth.uid()::text || '/%' or (coalesce(x->>'t', '') not like 'image/%' and coalesce(x->>'t', '') not like 'video/%') then raise exception 'Invalid photo or video'; end if;
    if x->>'t' like 'video/%' and x->'poster' is not null and coalesce(x->'poster'->>'p', '') not like auth.uid()::text || '/%' then raise exception 'Invalid video'; end if;
    r := r || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('p', x->>'p', 't', x->>'t', 'w', coalesce((x->>'w')::int, 0), 'h', coalesce((x->>'h')::int, 0),
           'd', case when x->>'t' like 'video/%' then coalesce((x->>'d')::int, 0) end,
           'poster', case when x->>'t' like 'video/%' and x->'poster' is not null then jsonb_build_object('p', x->'poster'->>'p', 't', coalesce(x->'poster'->>'t', 'image/jpeg')) end)));
  end loop;
  return case when jsonb_array_length(r) = 0 then null else r end;
end $$;

create or replace function public.create_post(p_body text, p_media jsonb, p_shared uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); b text := btrim(coalesce(p_body, '')); m jsonb; n int; nid uuid; o posts; sh jsonb := null;
begin
  if me is null or not public.feed_ok() then raise exception 'Community is not available for your account'; end if;
  m := public.feed_media(p_media, 4);
  if p_shared is not null then
    select * into o from posts where id = p_shared and deleted_at is null;
    if o.id is null then raise exception 'This post does not exist any more'; end if;
    sh := coalesce(o.shared, jsonb_build_object('id', o.id, 'author', o.author, 'who', o.who, 'body', left(o.body, 1500), 'media', o.media, 'at', o.created_at));
  end if;
  if char_length(b) < 1 and m is null and sh is null then raise exception 'Write something or add a photo'; end if;
  if char_length(b) > 4000 then raise exception 'Post too long (4000 characters maximum)'; end if;
  select count(*) into n from posts where author = me and created_at > now() - interval '1 day';
  if n >= 30 and public.my_level() < 3 then raise exception 'Daily post limit reached'; end if;
  insert into posts(author, who, body, media, shared) values (me, public.feed_who(me), b, m, sh) returning posts.id into nid;
  return nid;
end $$;
create or replace function public.create_post(p_body text, p_media jsonb) returns uuid
language sql security definer set search_path = public as $$ select public.create_post(p_body, p_media, null::uuid) $$;

create or replace function public.delete_post(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a uuid;
begin
  select author into a from posts where id = p_id;
  if a is null or not public.feed_ok() or (a <> auth.uid() and public.my_level() < 3) then raise exception 'Access denied'; end if;
  update posts set deleted_at = now(), deleted_by = auth.uid() where id = p_id and deleted_at is null;
end $$;

create or replace function public.toggle_like(p_post uuid, p_e text) returns boolean
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or not public.feed_ok() or not exists (select 1 from posts where id = p_post and deleted_at is null) then raise exception 'Access denied'; end if;
  if exists (select 1 from post_likes where post_id = p_post and uid = me and e = coalesce(nullif(p_e, ''), '❤️')) then
    delete from post_likes where post_id = p_post and uid = me; return false;
  end if;
  if exists (select 1 from post_likes where post_id = p_post and uid = me) then
    update post_likes set e = left(coalesce(nullif(p_e, ''), '❤️'), 16), created_at = now() where post_id = p_post and uid = me; return true;
  end if;
  insert into post_likes(post_id, uid, e) values (p_post, me, left(coalesce(nullif(p_e, ''), '❤️'), 16));
  return true;
end $$;

create or replace function public.add_comment(p_post uuid, p_body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); b text := btrim(coalesce(p_body, '')); n int; nid uuid;
begin
  if me is null or not public.feed_ok() or not exists (select 1 from posts where id = p_post and deleted_at is null) then raise exception 'Access denied'; end if;
  if char_length(b) < 1 then raise exception 'Empty comment'; end if;
  if char_length(b) > 1000 then raise exception 'Comment too long (1000 characters maximum)'; end if;
  select count(*) into n from post_comments where author = me and created_at > now() - interval '1 day';
  if n >= 300 and public.my_level() < 3 then raise exception 'Daily comment limit reached'; end if;
  insert into post_comments(post_id, author, who, body) values (p_post, me, public.feed_who(me), b) returning post_comments.id into nid;
  return nid;
end $$;

create or replace function public.delete_comment(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a uuid; pa uuid;
begin
  select c.author, p.author into a, pa from post_comments c join posts p on p.id = c.post_id where c.id = p_id;
  if a is null or not public.feed_ok() or (a <> auth.uid() and pa <> auth.uid() and public.my_level() < 3) then raise exception 'Access denied'; end if;
  update post_comments set deleted_at = now() where id = p_id and deleted_at is null;
end $$;

create or replace function public.create_story(p_media jsonb, p_body text, p_bg text) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); b text := btrim(coalesce(p_body, '')); m jsonb; n int; nid uuid;
begin
  if me is null or not public.feed_ok() then raise exception 'Community is not available for your account'; end if;
  m := public.feed_media(case when p_media is null then null when jsonb_typeof(p_media) = 'array' then p_media else jsonb_build_array(p_media) end, 1);
  if char_length(b) < 1 and m is null then raise exception 'Write something or add a photo'; end if;
  if char_length(b) > 300 then raise exception 'Story text too long (300 characters maximum)'; end if;
  select count(*) into n from stories where author = me and created_at > now() - interval '1 day';
  if n >= 40 and public.my_level() < 3 then raise exception 'Daily story limit reached'; end if;
  insert into stories(author, who, media, body, bg) values (me, public.feed_who(me), case when m is null then null else m->0 end, b, left(coalesce(p_bg, ''), 40)) returning stories.id into nid;
  return nid;
end $$;

create or replace function public.view_story(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); a uuid;
begin
  select author into a from stories where id = p_id and deleted_at is null and created_at > now() - interval '24 hours';
  if a is null or a = me or not public.feed_ok() then return; end if;
  insert into story_views(story_id, uid, who) values (p_id, me, public.feed_who(me)) on conflict do nothing;
end $$;

create or replace function public.delete_story(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a uuid;
begin
  select author into a from stories where id = p_id;
  if a is null or not public.feed_ok() or (a <> auth.uid() and public.my_level() < 3) then raise exception 'Access denied'; end if;
  update stories set deleted_at = now() where id = p_id and deleted_at is null;
end $$;

revoke all on function public.feed_enabled(), public.feed_ok(), public.feed_who(uuid), public.feed_media(jsonb, int),
  public.create_post(text, jsonb), public.create_post(text, jsonb, uuid), public.delete_post(uuid), public.toggle_like(uuid, text), public.add_comment(uuid, text),
  public.delete_comment(uuid), public.create_story(jsonb, text, text), public.view_story(uuid), public.delete_story(uuid) from public, anon;
grant execute on function public.feed_ok(), public.create_post(text, jsonb), public.create_post(text, jsonb, uuid), public.delete_post(uuid), public.toggle_like(uuid, text),
  public.add_comment(uuid, text), public.delete_comment(uuid), public.create_story(jsonb, text, text), public.view_story(uuid),
  public.delete_story(uuid) to authenticated;

-- =====================================================================
--  Réactions sur les stories (❤️ 😂 😮 …) : seul l'auteur de la story les voit
-- =====================================================================
create table if not exists public.story_reactions (
  story_id uuid not null references public.stories(id) on delete cascade,
  uid      uuid not null references auth.users(id) on delete cascade,
  who      jsonb not null default '{}'::jsonb,
  e        text not null default '❤️',
  at       timestamptz not null default now(),
  primary key (story_id, uid)
);
alter table public.story_reactions enable row level security;
drop policy if exists story_reactions_read on public.story_reactions;
create policy story_reactions_read on public.story_reactions for select to authenticated
  using (uid = auth.uid() or public.my_level() >= 3
         or exists (select 1 from public.stories s where s.id = story_id and s.author = auth.uid()));
revoke all on public.story_reactions from anon, authenticated;
grant select on public.story_reactions to authenticated;

create or replace function public.react_story(p_id uuid, p_e text) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); a uuid; v_e text := left(coalesce(p_e, ''), 16);
begin
  select author into a from stories where id = p_id and deleted_at is null and created_at > now() - interval '24 hours';
  if a is null or a = me or not public.feed_ok() then raise exception 'Access denied'; end if;
  if v_e = '' or exists (select 1 from story_reactions where story_id = p_id and uid = me and story_reactions.e = v_e) then
    delete from story_reactions where story_id = p_id and uid = me; return '';
  end if;
  insert into story_reactions(story_id, uid, who, e) values (p_id, me, public.feed_who(me), v_e)
    on conflict (story_id, uid) do update set e = excluded.e, at = now();
  insert into story_views(story_id, uid, who) values (p_id, me, public.feed_who(me)) on conflict do nothing;
  return v_e;
end $$;
revoke all on function public.react_story(uuid, text) from public, anon;
grant execute on function public.react_story(uuid, text) to authenticated;

-- =====================================================================
--  Vidéos : le dossier « chat » accepte les vidéos jusqu'à 50 Mo
-- =====================================================================
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    update storage.buckets set file_size_limit = 52428800,
      allowed_mime_types = (select array_agg(distinct x) from unnest(coalesce(allowed_mime_types, '{}'::text[]) || array['video/mp4','video/webm','video/quicktime','video/3gpp','image/jpeg','image/png','image/webp','image/gif']) x)
    where id = 'chat';
  end if;
end $$;

-- =====================================================================
--  NOTIFICATIONS : chacun ne voit que les siennes
-- =====================================================================
create table if not exists public.notifications (
  id         bigserial primary key,
  uid        uuid not null references auth.users(id) on delete cascade,
  kind       text not null,
  actor      uuid,
  who        jsonb not null default '{}'::jsonb,
  ref        text not null default '',
  body       text not null default '',
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index if not exists notifications_uid_idx on public.notifications (uid, created_at desc);
alter table public.notifications enable row level security;
drop policy if exists notifications_read on public.notifications;
create policy notifications_read on public.notifications for select to authenticated using (uid = auth.uid());
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.notifications;
    exception when duplicate_object then null; end;
  end if;
end $$;

create or replace function public.notif_text(b text) returns text
language sql immutable as $$
  select left(case when position(E'\n⟦' in coalesce(b, '')) > 0 then substr(b, position(E'\n⟦' in b) + 6) else coalesce(b, '') end, 140)
$$;

create or replace function public.notify(p_uid uuid, p_kind text, p_actor uuid, p_ref text, p_body text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_uid is null or p_uid = p_actor then return; end if;
  if not exists (select 1 from auth.users where id = p_uid) then return; end if;
  insert into notifications(uid, kind, actor, who, ref, body) values (p_uid, p_kind, p_actor, case when p_actor is null then '{}'::jsonb else public.feed_who(p_actor) end, coalesce(p_ref, ''), public.notif_text(p_body));
  if random() < 0.05 then delete from notifications where uid = p_uid and created_at < now() - interval '30 days'; end if;
end $$;
revoke all on function public.notify(uuid, text, uuid, text, text), public.notif_text(text) from public, anon, authenticated;

create or replace function public.mark_notifs_read(p_ids bigint[]) returns void
language sql security definer set search_path = public as $$
  update notifications set read_at = now() where uid = auth.uid() and read_at is null and (p_ids is null or id = any(p_ids))
$$;
revoke all on function public.mark_notifs_read(bigint[]) from public, anon;
grant execute on function public.mark_notifs_read(bigint[]) to authenticated;

-- déclencheurs : un message, un commentaire, une réaction… crée une notification
create or replace function public.trg_notif_peer() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify(new.receiver, case when coalesce(new.meta->'re'->>'id', '') = 'story' then 'story_reply' else 'msg' end, new.sender, 'peer:' || new.sender::text,
    case when coalesce(new.body, '') <> '' then new.body when new.att->>'k' = 'voice' then '🎤 Voice message' when new.att->>'k' = 'img' then '📷 Photo' when new.att->>'k' = 'sticker' then 'Sticker' else '📎 File' end);
  return new;
end $$;
drop trigger if exists notif_peer on public.peer_messages;
create trigger notif_peer after insert on public.peer_messages for each row execute function public.trg_notif_peer();

create or replace function public.trg_notif_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare a uuid;
begin
  select author into a from posts where id = new.post_id;
  perform public.notify(a, 'comment', new.author, 'post:' || new.post_id::text, new.body);
  return new;
end $$;
drop trigger if exists notif_comment on public.post_comments;
create trigger notif_comment after insert on public.post_comments for each row execute function public.trg_notif_comment();

create or replace function public.trg_notif_like() returns trigger
language plpgsql security definer set search_path = public as $$
declare a uuid;
begin
  select author into a from posts where id = new.post_id;
  perform public.notify(a, 'like', new.uid, 'post:' || new.post_id::text, new.e);
  return new;
end $$;
drop trigger if exists notif_like on public.post_likes;
create trigger notif_like after insert on public.post_likes for each row execute function public.trg_notif_like();

create or replace function public.trg_notif_share() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.shared is not null then perform public.notify((new.shared->>'author')::uuid, 'share', new.author, 'post:' || new.id::text, coalesce(new.shared->>'body', '')); end if;
  return new;
end $$;
drop trigger if exists notif_share on public.posts;
create trigger notif_share after insert on public.posts for each row execute function public.trg_notif_share();

create or replace function public.trg_notif_story_react() returns trigger
language plpgsql security definer set search_path = public as $$
declare a uuid;
begin
  select author into a from stories where id = new.story_id;
  perform public.notify(a, 'story_like', new.uid, 'story:' || new.story_id::text, new.e);
  return new;
end $$;
drop trigger if exists notif_story_react on public.story_reactions;
create trigger notif_story_react after insert or update of e on public.story_reactions for each row execute function public.trg_notif_story_react();

-- messages avec la professeure (documents students/<élève>/msgs/…) et entre professeurs (gradebook/chat_A_B/msgs/…)
create or replace function public.trg_notif_docs() returns trigger
language plpgsql security definer set search_path = public as $$
declare seg text[] := string_to_array(new.path, '/'); sid text; t text; pair text[]; me uuid := auth.uid(); other text;
begin
  if array_length(seg, 1) = 4 and seg[1] = 'students' and seg[3] = 'msgs' and seg[2] ~ '^[0-9a-fA-F-]{36}$' then
    sid := seg[2];
    if coalesce(new.data->>'from', '') = 'teacher' then
      perform public.notify(sid::uuid, 'tmsg', me, 'chat', coalesce(nullif(new.data->>'text', ''), '📎 Attachment'));
    elsif coalesce(new.data->>'from', '') = 'student' then
      select data->>'teacherId' into t from docs where path = 'students/' || sid;
      if t ~ '^[0-9a-fA-F-]{36}$' then perform public.notify(t::uuid, 'smsg', sid::uuid, 'chat:' || sid, coalesce(nullif(new.data->>'text', ''), '📎 Attachment')); end if;
    end if;
  elsif array_length(seg, 1) = 4 and seg[1] = 'gradebook' and seg[2] like 'chat\_%' and seg[3] = 'msgs' then
    pair := string_to_array(substr(seg[2], 6), '_');
    other := case when pair[1] = coalesce(new.data->>'from', '') then pair[2] else pair[1] end;
    if other ~ '^[0-9a-fA-F-]{36}$' then perform public.notify(other::uuid, 'staff', (new.data->>'from')::uuid, 'staff:' || coalesce(new.data->>'from', ''), coalesce(nullif(new.data->>'text', ''), '📎 Attachment')); end if;
  end if;
  return new;
exception when others then return new;
end $$;
drop trigger if exists notif_docs on public.docs;
create trigger notif_docs after insert on public.docs for each row
  when (new.path like 'students/%/msgs/%' or new.path like 'gradebook/chat%/msgs/%')
  execute function public.trg_notif_docs();

-- =====================================================================
--  SIGNALEMENTS : un élève signale une publication, une story, un message…
--  Les professeurs les voient dans la modération et reçoivent une notification.
-- =====================================================================
create table if not exists public.reports (
  id         bigserial primary key,
  uid        uuid not null references auth.users(id) on delete cascade,
  who        jsonb not null default '{}'::jsonb,
  kind       text not null,
  ref_id     text not null default '',
  target     uuid,
  target_who jsonb not null default '{}'::jsonb,
  reason     text not null default '',
  excerpt    text not null default '',
  created_at timestamptz not null default now(),
  done_at    timestamptz
);
alter table public.reports enable row level security;
drop policy if exists reports_read on public.reports;
create policy reports_read on public.reports for select to authenticated using (uid = auth.uid() or public.my_level() >= 3);
revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;

create or replace function public.report_content(p_kind text, p_ref text, p_target uuid, p_reason text, p_excerpt text) returns bigint
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n int; rid bigint; m record;
begin
  if me is null or public.my_level() < 2 then raise exception 'Access denied'; end if;
  select count(*) into n from reports where uid = me and created_at > now() - interval '1 day';
  if n >= 30 then raise exception 'Too many reports today'; end if;
  insert into reports(uid, who, kind, ref_id, target, target_who, reason, excerpt)
    values (me, public.feed_who(me), left(coalesce(p_kind, ''), 20), left(coalesce(p_ref, ''), 80), p_target,
            case when p_target is null then '{}'::jsonb else public.feed_who(p_target) end, left(coalesce(p_reason, ''), 300), left(coalesce(p_excerpt, ''), 300))
    returning reports.id into rid;
  for m in select uid from members where level in ('admin', 'owner') loop
    perform public.notify(m.uid, 'report', me, 'report:' || rid::text, coalesce(nullif(p_reason, ''), p_kind));
  end loop;
  return rid;
end $$;
create or replace function public.close_report(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_level() < 3 then raise exception 'Access denied'; end if;
  update reports set done_at = now() where id = p_id;
end $$;
revoke all on function public.report_content(text, text, uuid, text, text), public.close_report(bigint) from public, anon;
grant execute on function public.report_content(text, text, uuid, text, text), public.close_report(bigint) to authenticated;
