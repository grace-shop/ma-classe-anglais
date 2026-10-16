-- =====================================================================
--  MESSAGERIE DU PROFESSEUR + RÉPONSE AUTOMATIQUE (Nova)
--  À exécuter dans Supabase > SQL Editor (peut être relancé sans risque).
--  • Les élèves écrivent au professeur (texte, photos, captures d'écran).
--  • Si le réglage prof_bot = 'on', Nova répond tout de suite, en anglais.
--  • Si le professeur a répondu lui-même depuis moins de 15 minutes,
--    Nova ne répond pas (le professeur reprend la main).
-- =====================================================================

create extension if not exists pg_net;

create table if not exists public.prof_messages (
  id           uuid primary key default gen_random_uuid(),
  student      uuid not null references auth.users(id) on delete cascade,
  from_student boolean not null,
  auto         boolean not null default false,
  body         text not null default '' check (char_length(body) <= 4000),
  att          jsonb,
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);
create index if not exists prof_messages_student_idx on public.prof_messages (student, created_at desc);
alter table public.prof_messages enable row level security;

create or replace function public.is_teacher(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where uid = u and level in ('admin', 'owner'))
$$;

-- Lecture : l'élève voit sa conversation, le professeur voit tout. Aucune écriture directe.
drop policy if exists "prof_read" on public.prof_messages;
create policy "prof_read" on public.prof_messages for select to authenticated
  using (student = auth.uid() or public.is_teacher(auth.uid()));

-- Un élève envoie un message au professeur
create or replace function public.prof_send(p_body text, p_att jsonb default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); b text := btrim(coalesce(p_body, '')); a jsonb := null; n int; id uuid; k text;
begin
  if me is null or public.my_level() <> 2 then raise exception 'Access denied'; end if;
  if public.is_teacher(me) then raise exception 'Teachers do not use this chat'; end if;
  if not public.peer_ok(me) then raise exception 'Chat is turned off for your account'; end if;
  if p_att is not null and jsonb_typeof(p_att) = 'object' then
    k := p_att->>'k';
    if k not in ('img', 'file') then raise exception 'Invalid attachment'; end if;
    if coalesce(p_att->>'p', '') not like me::text || '/%' then raise exception 'Invalid file'; end if;
    a := jsonb_build_object('k', k, 'p', p_att->>'p', 't', left(coalesce(p_att->>'t', ''), 120), 'n', left(coalesce(p_att->>'n', ''), 80));
  end if;
  if char_length(b) < 1 and a is null then raise exception 'Empty message'; end if;
  if char_length(b) > 4000 then raise exception 'Message too long (4000 characters maximum)'; end if;
  select count(*) into n from prof_messages where student = me and from_student and created_at > now() - interval '1 minute';
  if n >= 10 then raise exception 'You are writing too fast: wait one minute'; end if;
  select count(*) into n from prof_messages where student = me and from_student and created_at > now() - interval '1 day';
  if n >= 200 then raise exception 'Daily message limit reached'; end if;
  insert into prof_messages (student, from_student, body, att) values (me, true, b, a) returning prof_messages.id into id;
  return id;
end $$;
grant execute on function public.prof_send(text, jsonb) to authenticated;

-- Déclenche la réponse automatique à chaque message d'élève
create or replace function public.prof_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare url text; sec text;
begin
  if not new.from_student then return new; end if;
  select value into url from app_config where key = 'prof_bot_url';
  select value into sec from app_config where key = 'prof_bot_secret';
  if coalesce(url, '') = '' or coalesce(sec, '') = '' then return new; end if;
  perform net.http_post(
    url := url,
    body := jsonb_build_object('id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-bot-secret', sec),
    timeout_milliseconds := 5000
  );
  return new;
end $$;
drop trigger if exists prof_notify on public.prof_messages;
create trigger prof_notify after insert on public.prof_messages
  for each row execute function public.prof_notify();

-- Réglages — la réponse automatique est coupée par défaut
insert into public.app_config (key, value) values
  ('prof_bot', 'off'),
  ('prof_bot_url', 'https://vcarrnmmdvmssrpbvnit.supabase.co/functions/v1/prof-bot'),
  ('prof_bot_secret', '6S5G-ULsVzss-YeUNQ4dnRGNK16HJ6P68t_9OvUNrTQ')
on conflict (key) do nothing;

-- Le professeur répond lui-même depuis l'application
create or replace function public.prof_teacher_reply(p_student uuid, p_body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare id uuid; b text := btrim(coalesce(p_body, ''));
begin
  if not public.is_teacher(auth.uid()) then raise exception 'Teachers only'; end if;
  if char_length(b) < 1 or char_length(b) > 4000 then raise exception 'Invalid message'; end if;
  insert into prof_messages (student, from_student, auto, body) values (p_student, false, false, b)
    returning prof_messages.id into id;
  return id;
end $$;
grant execute on function public.prof_teacher_reply(uuid, text) to authenticated;
