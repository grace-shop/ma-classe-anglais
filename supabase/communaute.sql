-- =====================================================================
--  COMMUNITY : publications (fil d'actualité) et stories de 24 h
--  À exécuter dans Supabase > SQL Editor, APRÈS messagerie.sql
--  (peut être relancé sans risque).
--  Règles appliquées par le SERVEUR :
--   • publient et voient : les élèves actifs de l'école (comme le chat entre
--     élèves : pas les parents, pas le primaire) et les professeurs
--   • publications : 4000 caractères, 4 photos, 30 par jour
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
    if coalesce(x->>'p', '') not like auth.uid()::text || '/%' or coalesce(x->>'t', '') not like 'image/%' then raise exception 'Invalid photo'; end if;
    r := r || jsonb_build_array(jsonb_build_object('p', x->>'p', 't', x->>'t', 'w', coalesce((x->>'w')::int, 0), 'h', coalesce((x->>'h')::int, 0)));
  end loop;
  return case when jsonb_array_length(r) = 0 then null else r end;
end $$;

create or replace function public.create_post(p_body text, p_media jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); b text := btrim(coalesce(p_body, '')); m jsonb; n int; nid uuid;
begin
  if me is null or not public.feed_ok() then raise exception 'Community is not available for your account'; end if;
  m := public.feed_media(p_media, 4);
  if char_length(b) < 1 and m is null then raise exception 'Write something or add a photo'; end if;
  if char_length(b) > 4000 then raise exception 'Post too long (4000 characters maximum)'; end if;
  select count(*) into n from posts where author = me and created_at > now() - interval '1 day';
  if n >= 30 and public.my_level() < 3 then raise exception 'Daily post limit reached'; end if;
  insert into posts(author, who, body, media) values (me, public.feed_who(me), b, m) returning posts.id into nid;
  return nid;
end $$;

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
  if exists (select 1 from post_likes where post_id = p_post and uid = me) then
    delete from post_likes where post_id = p_post and uid = me; return false;
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
  public.create_post(text, jsonb), public.delete_post(uuid), public.toggle_like(uuid, text), public.add_comment(uuid, text),
  public.delete_comment(uuid), public.create_story(jsonb, text, text), public.view_story(uuid), public.delete_story(uuid) from public, anon;
grant execute on function public.feed_ok(), public.create_post(text, jsonb), public.delete_post(uuid), public.toggle_like(uuid, text),
  public.add_comment(uuid, text), public.delete_comment(uuid), public.create_story(jsonb, text, text), public.view_story(uuid),
  public.delete_story(uuid) to authenticated;
