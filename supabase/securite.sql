-- =====================================================================
--  SÉCURITÉ : un élève ne peut plus tricher sur ses notes, son XP,
--  ses points dépensés ni valider lui-même ses récompenses.
--  À exécuter dans Supabase > SQL Editor (peut être relancé sans risque).
-- =====================================================================

-- Limites réglables (XP maximum par action et par jour)
insert into public.app_config(key, value) values
  ('xp_step_cap',  '400'),    -- XP maximum gagnés en une seule action
  ('xp_daily_cap', '1500')    -- XP maximum gagnés par jour et par élève
on conflict (key) do nothing;

create table if not exists public.xp_budget (
  uid    uuid not null,
  day    date not null default current_date,
  gained int  not null default 0,
  primary key (uid, day)
);
alter table public.xp_budget enable row level security;   -- aucune règle : seul le serveur y touche

create or replace function public.cfg_int(k text, d int) returns int
language sql stable security definer set search_path = public as $$
  select coalesce((select value::int from app_config where key = k), d)
$$;

-- Lecture sûre d'un nombre dans un JSON (sinon : valeur de secours)
create or replace function public.jnum(j jsonb, k text, d numeric) returns numeric
language sql immutable as $$
  select case when jsonb_typeof(j->k) = 'number' then (j->>k)::numeric else d end
$$;

-- ---------- 1) Notes : réservées à la prof et au serveur ----------
create or replace function public.protect_grades() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and new.path ~ '^students/[^/]+$' and public.my_level() < 3 then
    if tg_op = 'UPDATE' then
      new.data := (coalesce(new.data, '{}'::jsonb) - 'feedback' - 'epreuveFb')
        || jsonb_build_object(
             'feedback',  coalesce(old.data->'feedback',  '{}'::jsonb),
             'epreuveFb', coalesce(old.data->'epreuveFb', '{}'::jsonb));
    else
      new.data := coalesce(new.data, '{}'::jsonb) - 'feedback' - 'epreuveFb';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_grades on public.docs;
create trigger protect_grades before insert or update on public.docs
  for each row execute function public.protect_grades();

-- ---------- 2) XP, points dépensés, récompenses, classement ----------
create or replace function public.protect_progress() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  me text; d jsonb; oxp numeric; nxp numeric; ospent numeric; nspent numeric;
  delta numeric; step int; cap int; used int; room numeric; sx numeric;
  oldr jsonb; k text; v jsonb;
begin
  -- La prof, le propriétaire et le serveur ne sont pas limités
  if auth.uid() is null or public.my_level() >= 3 then return new; end if;
  me := auth.uid()::text;

  -- Fiche de l'élève
  if new.path ~ '^students/[^/]+$' and split_part(new.path, '/', 2) = me then
    d := coalesce(new.data, '{}'::jsonb);

    if tg_op = 'INSERT' then            -- une nouvelle fiche démarre toujours à zéro
      new.data := (jsonb_set(jsonb_set(d, '{xp}', '0'::jsonb), '{spent}', '0'::jsonb)) - 'redeems';
      return new;
    end if;

    oxp := public.jnum(old.data, 'xp', 0);
    nxp := public.jnum(d, 'xp', oxp);
    delta := nxp - oxp;
    if delta < 0 then delta := 0; end if;            -- l'XP ne baisse jamais côté élève
    if delta > 0 then
      step := public.cfg_int('xp_step_cap', 400);
      cap  := public.cfg_int('xp_daily_cap', 1500);
      if delta > step then delta := step; end if;
      insert into xp_budget(uid, day, gained) values (auth.uid(), current_date, 0) on conflict do nothing;
      select gained into used from xp_budget where uid = auth.uid() and day = current_date for update;
      room := greatest(0, cap - coalesce(used, 0));
      if delta > room then delta := room; end if;
      update xp_budget set gained = gained + delta::int where uid = auth.uid() and day = current_date;
    end if;
    nxp := oxp + delta;
    d := jsonb_set(d, '{xp}', to_jsonb(nxp));

    ospent := public.jnum(old.data, 'spent', 0);
    nspent := public.jnum(d, 'spent', ospent);
    if nspent < ospent or nspent > nxp then nspent := ospent; end if;   -- on ne récupère pas ses points, on ne dépense pas plus que son XP
    d := jsonb_set(d, '{spent}', to_jsonb(nspent));

    -- Récompenses : seule la prof peut les accepter ou les refuser
    if jsonb_typeof(d->'redeems') = 'object' then
      oldr := coalesce(old.data->'redeems', '{}'::jsonb);
      for k, v in select key, value from jsonb_each(d->'redeems') loop
        if oldr ? k then
          d := jsonb_set(d, array['redeems', k],
                 (v - 'status' - 'decidedAt')
                 || jsonb_strip_nulls(jsonb_build_object('status', oldr->k->'status', 'decidedAt', oldr->k->'decidedAt')));
        else
          d := jsonb_set(d, array['redeems', k], ((v - 'decidedAt') || jsonb_build_object('status', 'pending')));
        end if;
      end loop;
    end if;

    new.data := d;
    return new;
  end if;

  -- Classement : l'XP affiché ne peut pas dépasser l'XP réel de la fiche
  if new.path ~ '^board/[^/]+$' and split_part(new.path, '/', 2) = me then
    select public.jnum(data, 'xp', 0) into sx from docs where path = 'students/' || me;
    d := coalesce(new.data, '{}'::jsonb);
    if jsonb_typeof(d->'xp') = 'number' and (d->>'xp')::numeric > coalesce(sx, 0) then
      d := jsonb_set(d, '{xp}', to_jsonb(coalesce(sx, 0)));
    end if;
    new.data := d;
  end if;
  return new;
end $$;

drop trigger if exists protect_progress on public.docs;
create trigger protect_progress before insert or update on public.docs
  for each row execute function public.protect_progress();

-- ---------- 3) Appareils suspendus ----------
-- La prof peut suspendre un appareil précis d'un élève (liste « appareils » de sa fiche).
-- L'application envoie l'identifiant de l'appareil (en-tête x-device-id) ; le serveur refuse alors
-- toute lecture ou écriture venant de cet appareil, même si l'élève bidouille l'application.
create or replace function public.my_level() returns int
language plpgsql stable security definer set search_path = public as $$
declare lv int; st text; hdr text; dev text;
begin
  if auth.uid() is null then return 0; end if;
  select level_rank(level) into lv from members where uid = auth.uid();
  lv := coalesce(lv, 1);
  if lv <= 2 then
    select data->>'status' into st from docs where path = 'access/' || auth.uid()::text;
    if st in ('blocked', 'refused') then lv := 1; end if;
    begin hdr := current_setting('request.headers', true); exception when others then hdr := null; end;
    if hdr is not null and hdr <> '' then
      begin dev := (hdr::json)->>'x-device-id'; exception when others then dev := null; end;
      if dev is not null and exists (
           select 1 from docs where path = 'access/' || auth.uid()::text and (data->'blockedDevices'->>dev) = 'true')
      then lv := 1; end if;
    end if;
  end if;
  return lv;
end $$;

-- Un élève doit toujours pouvoir lire SA fiche d'accès (pour savoir qu'il est suspendu)
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'access_rules') then
    update public.access_rules set read_level = 'view' where pattern = 'access/{self}';
  end if;
end $$;
