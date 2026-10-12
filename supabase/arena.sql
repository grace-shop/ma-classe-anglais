-- =====================================================================
--  ARENA : classement de la classe (un meilleur score par élève et par jeu)
--  À exécuter dans Supabase (SQL Editor). Sans danger à relancer.
-- =====================================================================

create table if not exists public.arena_scores (
  id     bigserial primary key,
  uid    uuid not null references auth.users(id) on delete cascade,
  name   text not null default 'Student',
  mode   text not null,
  score  int  not null check (score >= 0 and score <= 100000),
  at     timestamptz not null default now()
);
create index if not exists arena_scores_mode_idx on public.arena_scores (mode, score desc);

-- personne ne lit ou n'écrit la table directement : seulement par les fonctions ci-dessous
alter table public.arena_scores enable row level security;
revoke all on public.arena_scores from anon, authenticated;

-- enregistre un score ; ne garde que le meilleur de chaque élève pour chaque jeu
create or replace function public.arena_submit(p_mode text, p_score int) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); nm text;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if p_mode not in ('quiz','guess','fill','order','cards','clock') then raise exception 'Unknown game'; end if;
  if p_score is null or p_score < 0 or p_score > 100000 then raise exception 'Bad score'; end if;
  select coalesce(nullif(btrim(d.data->>'name'), ''), 'Student') into nm from docs d where d.path = 'students/' || me::text;
  nm := coalesce(nm, 'Student');
  if not exists (select 1 from public.arena_scores where uid = me and mode = p_mode and score >= p_score) then
    delete from public.arena_scores where uid = me and mode = p_mode;
    insert into public.arena_scores (uid, name, mode, score) values (me, left(nm, 40), p_mode, p_score);
  end if;
end $$;

-- le classement : les 10 meilleurs (prénom et nom seulement)
create or replace function public.arena_board(p_mode text)
returns table (name text, score int, me boolean)
language sql security definer stable set search_path = public as $$
  select s.name, s.score, (s.uid = auth.uid())
  from public.arena_scores s
  where s.mode = p_mode
  order by s.score desc, s.at asc
  limit 10;
$$;

revoke all on function public.arena_submit(text, int), public.arena_board(text) from public, anon;
grant execute on function public.arena_submit(text, int), public.arena_board(text) to authenticated;
