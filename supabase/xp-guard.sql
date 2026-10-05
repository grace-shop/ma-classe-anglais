-- =====================================================================
--  Verrou de l'XP : un élève ne peut plus s'attribuer des points à la main.
--  À coller dans Supabase → SQL Editor → New query → Run (sans risque : on peut le relancer).
--  Les professeurs et la prof principale ne sont pas concernés.
-- =====================================================================
create table if not exists public.xp_guard (
  uid    uuid not null,
  day    date not null default current_date,
  gained int  not null default 0,
  primary key (uid, day)
);
alter table public.xp_guard enable row level security;   -- aucune règle : seules les fonctions du serveur y touchent

create or replace function public.guard_xp() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  oxp numeric := 0; nxp numeric := 0; osp numeric := 0; nsp numeric := 0;
  d numeric; g int; sxp numeric;
  max_per_write constant int := 500;    -- plus gros gain plausible en une seule action
  max_per_day   constant int := 2500;   -- plafond d'XP par élève et par jour
begin
  if auth.uid() is null or public.my_level() >= 3 then return new; end if;   -- serveur ou professeur : libre

  if new.col = 'students' and new.id = auth.uid()::text then
    if tg_op = 'INSERT' then
      new.data := (new.data - 'spent') || jsonb_build_object('xp', 0);
      return new;
    end if;
    oxp := coalesce((old.data->>'xp')::numeric, 0);
    osp := coalesce((old.data->>'spent')::numeric, 0);
    nxp := coalesce((new.data->>'xp')::numeric, oxp);
    nsp := coalesce((new.data->>'spent')::numeric, osp);
    d := nxp - oxp;
    if d < 0 then nxp := oxp; d := 0; end if;                 -- l'XP ne peut pas baisser
    if nsp < osp then nsp := osp; end if;                       -- les dépenses ne peuvent pas être annulées
    if nsp > nxp then raise exception 'xp: dépense supérieure aux points' using errcode = '23514'; end if;
    if d > 0 then
      if d > max_per_write then raise exception 'xp: gain trop élevé' using errcode = '23514'; end if;
      insert into xp_guard(uid, day, gained) values (auth.uid(), current_date, d::int)
        on conflict (uid, day) do update set gained = xp_guard.gained + d::int
        returning gained into g;
      if g > max_per_day then raise exception 'xp: plafond du jour atteint' using errcode = '23514'; end if;
    end if;
    new.data := new.data || jsonb_build_object('xp', nxp, 'spent', nsp);
    return new;
  end if;

  if new.col = 'board' and new.id = auth.uid()::text then       -- classement : jamais plus que la fiche (marge de 500)
    select coalesce((data->>'xp')::numeric, 0) into sxp from docs where path = 'students/' || auth.uid()::text;
    if coalesce((new.data->>'xp')::numeric, 0) > coalesce(sxp, 0) + max_per_write then
      new.data := new.data || jsonb_build_object('xp', coalesce(sxp, 0));
    end if;
  end if;
  return new;
end $$;

drop trigger if exists docs_guard on public.docs;
create trigger docs_guard before insert or update on public.docs
  for each row execute function public.guard_xp();
