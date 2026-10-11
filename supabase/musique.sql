-- =====================================================================
--  MUSIC, AUDIO POSTS AND TEXT ON VIDEOS (Community)
--  Run in Supabase > SQL Editor AFTER communaute.sql (safe to run again).
--   • stories and posts can carry music:  music = {b, title, start, d}
--       b = id of a built-in "English Classes Beats" track (made on the phone, no file)
--     or music = {p, t, title, start, d}  (an audio file in the private "chat" folder,
--       always inside the author's own folder)
--   • posts can contain audio tracks (beat maker, voice, songs): media item {p, t:"audio/…", title, d}
--   • videos can carry text / emoji overlays: media item ov = [{t, x, y, s, c, style}]
--   • the old functions create_story(3 params) and create_post(2 or 3 params) keep working
-- =====================================================================

alter table public.stories add column if not exists music jsonb;
alter table public.posts add column if not exists music jsonb;

-- text / emoji overlays drawn over a video (max 12)
create or replace function public.feed_overlays(p jsonb) returns jsonb
language plpgsql immutable set search_path = public as $$
declare r jsonb := '[]'::jsonb; x jsonb; n int := 0; st text; c text;
begin
  if p is null or jsonb_typeof(p) <> 'array' then return null; end if;
  for x in select * from jsonb_array_elements(p) loop
    n := n + 1; exit when n > 12;
    if jsonb_typeof(x) <> 'object' or char_length(btrim(coalesce(x->>'t', ''))) = 0 then continue; end if;
    st := coalesce(x->>'style', 'plain'); if st not in ('plain', 'pill', 'neon', 'emoji') then st := 'plain'; end if;
    c := coalesce(x->>'c', '#ffffff'); if c !~ '^#[0-9a-fA-F]{3,8}$' then c := '#ffffff'; end if;
    r := r || jsonb_build_array(jsonb_build_object(
      't', left(x->>'t', 120),
      'x', round(least(1, greatest(0, coalesce((x->>'x')::numeric, .5))), 4),
      'y', round(least(1, greatest(0, coalesce((x->>'y')::numeric, .5))), 4),
      's', round(least(.6, greatest(.02, coalesce((x->>'s')::numeric, .08))), 4),
      'c', c, 'style', st));
  end loop;
  return case when jsonb_array_length(r) = 0 then null else r end;
end $$;

-- photos, videos (poster + overlays) and audio tracks, always in the caller's own folder
create or replace function public.feed_media2(p jsonb, maxn int) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb := '[]'::jsonb; x jsonb; n int := 0; t text; me text := auth.uid()::text;
begin
  if p is null or jsonb_typeof(p) <> 'array' then return null; end if;
  for x in select * from jsonb_array_elements(p) loop
    n := n + 1; exit when n > maxn;
    t := coalesce(x->>'t', '');
    if me is null or coalesce(x->>'p', '') not like me || '/%' or coalesce(x->>'p', '') like '%..%'
       or (t not like 'image/%' and t not like 'video/%' and t not like 'audio/%') then raise exception 'Invalid photo, video or audio'; end if;
    if t like 'video/%' and x->'poster' is not null and coalesce(x->'poster'->>'p', '') not like me || '/%' then raise exception 'Invalid video'; end if;
    r := r || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('p', x->>'p', 't', t,
           'w', case when t like 'image/%' then coalesce((x->>'w')::int, 0) end,
           'h', case when t like 'image/%' then coalesce((x->>'h')::int, 0) end,
           'd', case when t like 'video/%' or t like 'audio/%' then least(3600, greatest(0, coalesce((x->>'d')::numeric, 0)))::int end,
           'poster', case when t like 'video/%' and x->'poster' is not null then jsonb_build_object('p', x->'poster'->>'p', 't', coalesce(x->'poster'->>'t', 'image/jpeg')) end,
           'ov', case when t like 'video/%' then public.feed_overlays(x->'ov') end,
           'title', case when t like 'audio/%' then nullif(left(btrim(coalesce(x->>'title', '')), 60), '') end)));
  end loop;
  return case when jsonb_array_length(r) = 0 then null else r end;
end $$;

-- music of a story or a post
create or replace function public.feed_music(m jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me text := auth.uid()::text; b text; st numeric; d numeric;
begin
  if m is null or jsonb_typeof(m) <> 'object' then return null; end if;
  st := least(3600, greatest(0, coalesce((m->>'start')::numeric, 0)));
  d := least(60, greatest(1, coalesce((m->>'d')::numeric, 15)));
  b := m->>'b';
  if b is not null then
    if b !~ '^[a-z0-9_-]{1,24}$' then raise exception 'Invalid music'; end if;
    return jsonb_build_object('b', b, 'title', left(coalesce(nullif(btrim(m->>'title'), ''), 'Music'), 60), 'start', round(st, 2), 'd', round(d, 2));
  end if;
  if me is null or coalesce(m->>'p', '') not like me || '/%' or coalesce(m->>'p', '') like '%..%' or coalesce(m->>'t', '') not like 'audio/%' then
    raise exception 'Invalid music';
  end if;
  return jsonb_build_object('p', m->>'p', 't', m->>'t', 'title', left(coalesce(nullif(btrim(m->>'title'), ''), 'Music'), 60), 'start', round(st, 2), 'd', round(d, 2));
end $$;

-- new story function (4 params): media may be a photo, a video (with overlays) and music
create or replace function public.create_story(p_media jsonb, p_body text, p_bg text, p_music jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); b text := btrim(coalesce(p_body, '')); m jsonb; mu jsonb; n int; nid uuid;
begin
  if me is null or not public.feed_ok() then raise exception 'Community is not available for your account'; end if;
  m := public.feed_media2(case when p_media is null then null when jsonb_typeof(p_media) = 'array' then p_media else jsonb_build_array(p_media) end, 1);
  if m is not null and m->0->>'t' like 'audio/%' then raise exception 'Add the song as music, not as the story picture'; end if;
  mu := public.feed_music(p_music);
  if char_length(b) < 1 and m is null then raise exception 'Write something or add a photo'; end if;
  if char_length(b) > 300 then raise exception 'Story text too long (300 characters maximum)'; end if;
  select count(*) into n from stories where author = me and created_at > now() - interval '1 day';
  if n >= 40 and public.my_level() < 3 then raise exception 'Daily story limit reached'; end if;
  insert into stories(author, who, media, body, bg, music)
    values (me, public.feed_who(me), case when m is null then null else m->0 end, b, left(coalesce(p_bg, ''), 40), mu)
    returning stories.id into nid;
  return nid;
end $$;

-- new post function (4 params): photos, videos, audio tracks, shared post, music
create or replace function public.create_post(p_body text, p_media jsonb, p_shared uuid, p_music jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); b text := btrim(coalesce(p_body, '')); m jsonb; mu jsonb; n int; nid uuid; o posts; sh jsonb := null;
begin
  if me is null or not public.feed_ok() then raise exception 'Community is not available for your account'; end if;
  m := public.feed_media2(p_media, 4);
  mu := public.feed_music(p_music);
  if p_shared is not null then
    select * into o from posts where id = p_shared and deleted_at is null;
    if o.id is null then raise exception 'This post does not exist any more'; end if;
    sh := coalesce(o.shared, jsonb_build_object('id', o.id, 'author', o.author, 'who', o.who, 'body', left(o.body, 1500), 'media', o.media, 'at', o.created_at));
  end if;
  if char_length(b) < 1 and m is null and sh is null and mu is null then raise exception 'Write something or add a photo'; end if;
  if char_length(b) > 4000 then raise exception 'Post too long (4000 characters maximum)'; end if;
  select count(*) into n from posts where author = me and created_at > now() - interval '1 day';
  if n >= 30 and public.my_level() < 3 then raise exception 'Daily post limit reached'; end if;
  insert into posts(author, who, body, media, shared, music) values (me, public.feed_who(me), b, m, sh, mu) returning posts.id into nid;
  return nid;
end $$;

revoke all on function public.feed_overlays(jsonb), public.feed_media2(jsonb, int), public.feed_music(jsonb),
  public.create_story(jsonb, text, text, jsonb), public.create_post(text, jsonb, uuid, jsonb) from public, anon;
grant execute on function public.create_story(jsonb, text, text, jsonb), public.create_post(text, jsonb, uuid, jsonb) to authenticated;

-- the private "chat" folder accepts WAV songs (beat maker) and common song formats
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    update storage.buckets set
      allowed_mime_types = (select array_agg(distinct x) from unnest(coalesce(allowed_mime_types, '{}'::text[]) || array['audio/wav','audio/x-wav','audio/wave','audio/mpeg','audio/mp4','audio/aac','audio/x-m4a','audio/ogg','audio/webm']) x)
    where id = 'chat' and allowed_mime_types is not null;
  end if;
end $$;

notify pgrst, 'reload schema';
