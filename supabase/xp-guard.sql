-- =====================================================================
--  Verrou de l'XP : un élève ne peut plus se donner de l'XP à volonté.
--  À coller dans Supabase → SQL Editor → New query → Run (sans risque, relançable).
--  Règles pour un élève / un parent (les professeurs ne sont pas limités) :
--   1. son XP ne peut jamais baisser ;
--   2. un seul enregistrement ne peut pas ajouter plus de 'xp_max_per_write' XP ;
--   3. il ne peut pas gagner plus de 'xp_max_per_day' XP par jour ;
--   4. son XP au classement (board) ne peut pas dépasser son vrai XP.
--  Tout excès est simplement ramené à la limite (l'application ne plante pas).
-- =====================================================================

insert into public.app_config(key, value) values
  ('xp_max_per_write', '600'),
  ('xp_max_per_day',   '4000')
on conflict (key) do nothing;

create table if not exists public.xp_daily (
  uid    uuid not null,
  day    date not null default current_date,
  gained int  not null default 0,
  primary key (uid, day)
);
alter table public.xp_daily enable row level security;

create or replace function public.guard_student_xp() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  me text := auth.uid()::text;
  old_xp numeric := 0; new_xp numeric := 0; real_xp numeric := 0;
  gain numeric; allowed numeric; used int;
  per_write int := coalesce((select value::int from app_config where key = 'xp_max_per_write'), 600);
  per_day   int := coalesce((select value::int from app_config where key = 'xp_max_per_day'), 4000);
begin
  if me is null or public.my_level() >= 3 then return new; end if;   -- professeurs et serveur : libres

  if new.path = 'students/' || me then
    new_xp := coalesce((new.data->>'xp')::numeric, 0);
    if tg_op = 'UPDATE' then old_xp := coalesce((old.data->>'xp')::numeric, 0); end if;
    if new_xp < old_xp then new_xp := old_xp; end if;                 -- l'XP ne baisse pas
    gain := new_xp - old_xp;
    if gain > 0 then
      allowed := least(gain, per_write);
      select coalesce(gained, 0) into used from xp_daily where uid = auth.uid() and day = current_date;
      used := coalesce(used, 0);
      allowed := greatest(0, least(allowed, per_day - used));
      insert into xp_daily(uid, day, gained) values (auth.uid(), current_date, allowed)
        on conflict (uid, day) do update set gained = xp_daily.gained + allowed;
      new_xp := old_xp + allowed;
    end if;
    if new.data ? 'xp' or tg_op = 'INSERT' then
      new.data := jsonb_set(new.data, '{xp}', to_jsonb(new_xp::bigint));
    end if;

  elsif new.path = 'board/' || me then                                 -- classement
    select coalesce((data->>'xp')::numeric, 0) into real_xp from docs where path = 'students/' || me;
    real_xp := coalesce(real_xp, 0);
    if coalesce((new.data->>'xp')::numeric, 0) > real_xp then
      new.data := jsonb_set(new.data, '{xp}', to_jsonb(real_xp::bigint));
    end if;
  end if;
  return new;
end $$;

-- nom en « zz_ » : s'exécute après docs_fill
drop trigger if exists zz_docs_xp_guard on public.docs;
create trigger zz_docs_xp_guard before insert or update on public.docs
  for each row execute function public.guard_student_xp();
