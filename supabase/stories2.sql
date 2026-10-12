-- =====================================================================
--  STORIES v2 : durée d'affichage et public choisi
--   • durée : 5, 10, 15 ou 30 secondes (photos et textes ; les vidéos gardent leur longueur)
--   • public : tout le monde, ou tout le monde SAUF une personne (elle ne voit pas la story)
--  À exécuter APRÈS supabase/musique.sql (ce fichier remplace les anciennes fonctions create_story).
--  Sans danger à relancer.
-- =====================================================================

alter table public.stories add column if not exists dur int;                       -- secondes (null = ancien comportement)
alter table public.stories add column if not exists aud text not null default 'all';  -- 'all' | 'hide'
alter table public.stories add column if not exists hide uuid;                    -- la personne qui ne voit pas la story

-- lecture : la personne masquée ne reçoit pas la story
drop policy if exists stories_read on public.stories;
create policy stories_read on public.stories for select to authenticated
  using (public.feed_ok()
         and (hide is null or hide <> auth.uid())
         and ((deleted_at is null and created_at > now() - interval '24 hours')
              or (public.my_level() >= 3 and created_at > now() - interval '14 days')));

-- on retire les anciennes versions pour éviter les doublons
drop function if exists public.create_story(jsonb, text, text);
drop function if exists public.create_story(jsonb, text, text, jsonb);

create or replace function public.create_story(p_media jsonb, p_body text, p_bg text,
    p_music jsonb default null, p_dur int default 5, p_aud text default 'all', p_hide uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); b text := btrim(coalesce(p_body, '')); m jsonb; mu jsonb; n int; nid uuid;
        d int; hd uuid := null;
begin
  if me is null or not public.feed_ok() then raise exception 'Community is not available for your account'; end if;
  m := public.feed_media2(case when p_media is null then null when jsonb_typeof(p_media) = 'array' then p_media else jsonb_build_array(p_media) end, 1);
  if m is not null and m->0->>'t' like 'audio/%' then raise exception 'Add the song as music, not as the story picture'; end if;
  mu := public.feed_music(p_music);
  if char_length(b) < 1 and m is null then raise exception 'Write something or add a photo'; end if;
  if char_length(b) > 300 then raise exception 'Story text too long (300 characters maximum)'; end if;
  select count(*) into n from stories where author = me and created_at > now() - interval '1 day';
  if n >= 40 and public.my_level() < 3 then raise exception 'Daily story limit reached'; end if;

  d := least(30, greatest(3, coalesce(p_dur, 5)));
  if p_aud = 'hide' then
    if p_hide is null or p_hide = me then raise exception 'Choose a classmate to hide the story from'; end if;
    hd := p_hide;
  end if;

  insert into stories(author, who, media, body, bg, music, dur, aud, hide)
    values (me, public.feed_who(me), case when m is null then null else m->0 end, b,
            left(coalesce(p_bg, ''), 40), mu, d, case when hd is null then 'all' else 'hide' end, hd)
    returning stories.id into nid;
  return nid;
end $$;

revoke all on function public.create_story(jsonb, text, text, jsonb, int, text, uuid) from public, anon;
grant execute on function public.create_story(jsonb, text, text, jsonb, int, text, uuid) to authenticated;
