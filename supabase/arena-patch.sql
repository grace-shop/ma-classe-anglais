-- =====================================================================
--  CORRECTIF ARENA (à exécuter une fois dans Supabase, après les autres
--  fichiers SQL). Sans danger à relancer.
--
--  1. arena_submit accepte les nouveaux jeux : Odd One Out (odd),
--     Grammar Traps (traps) et les défis par niveau et de vocabulaire (ch-*).
--     Avant, ces scores étaient refusés en silence.
--  2. arena_create accepte jusqu'à 40 questions (au lieu de 20).
--     Avant, les défis « Easy marathon » (25) et « Exam simulation » (30)
--     échouaient avec « Bad questions ».
-- =====================================================================

-- 1 · scores : tous les jeux de l'Arena
create or replace function public.arena_submit(p_mode text, p_score int) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); nm text;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not (p_mode in ('quiz','guess','fill','order','cards','clock','odd','traps') or p_mode like 'ch-%') then
    raise exception 'Unknown game';
  end if;
  if p_score is null or p_score < 0 or p_score > 100000 then raise exception 'Bad score'; end if;
  select coalesce(nullif(btrim(d.data->>'name'), ''), 'Student') into nm from docs d where d.path = 'students/' || me::text;
  nm := coalesce(nm, 'Student');
  if not exists (select 1 from public.arena_scores where uid = me and mode = p_mode and score >= p_score) then
    delete from public.arena_scores where uid = me and mode = p_mode;
    insert into public.arena_scores (uid, name, mode, score) values (me, left(nm, 40), p_mode, p_score);
  end if;
end $$;

-- 2 · battles : jusqu'à 40 questions par salon
create or replace function public.arena_create(p_kind text, p_mode text, p_qs jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c text; rid uuid; tries int := 0; chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if me is null then raise exception 'Sign in first'; end if;
  if p_kind not in ('duel','battle','royale') then raise exception 'Unknown battle'; end if;
  if jsonb_typeof(p_qs) <> 'array' or jsonb_array_length(p_qs) < 1 or jsonb_array_length(p_qs) > 40 then raise exception 'Bad questions'; end if;
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
