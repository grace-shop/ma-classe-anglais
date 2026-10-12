-- =====================================================================
--  Arena : nouveaux jeux (Odd One Out, Grammar Traps) dans le classement.
--  À exécuter APRÈS supabase/arena.sql. Sans danger à relancer.
-- =====================================================================
create or replace function public.arena_submit(p_mode text, p_score int) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); nm text;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if p_mode not in ('quiz','guess','fill','order','cards','clock','odd','traps') then raise exception 'Unknown game'; end if;
  if p_score is null or p_score < 0 or p_score > 100000 then raise exception 'Bad score'; end if;
  select coalesce(nullif(btrim(d.data->>'name'), ''), 'Student') into nm from docs d where d.path = 'students/' || me::text;
  nm := coalesce(nm, 'Student');
  if not exists (select 1 from public.arena_scores where uid = me and mode = p_mode and score >= p_score) then
    delete from public.arena_scores where uid = me and mode = p_mode;
    insert into public.arena_scores (uid, name, mode, score) values (me, left(nm, 40), p_mode, p_score);
  end if;
end $$;
