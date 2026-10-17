-- =====================================================================
--  RÉPONSE AUTOMATIQUE dans « My teacher » (messages privés élève-professeur)
--  À exécuter APRÈS supabase/prof-auto.sql, dans Supabase > SQL Editor.
--  Utilise les mêmes réglages app_config (prof_bot, prof_bot_url, prof_bot_secret)
--  et la même fonction prof-bot.
-- =====================================================================

create or replace function public.chat_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare url text; sec text; onoff text;
begin
  -- seulement les messages écrits par un élève dans une conversation avec le professeur
  if coalesce(new.data->>'from', '') <> 'student' or new.path !~ '^students/[^/]+/msgs/' then return new; end if;
  select value into onoff from app_config where key = 'prof_bot';
  if onoff is distinct from 'on' then return new; end if;
  select value into url from app_config where key = 'prof_bot_url';
  select value into sec from app_config where key = 'prof_bot_secret';
  if coalesce(url, '') = '' or coalesce(sec, '') = '' then return new; end if;
  perform net.http_post(
    url := url,
    body := jsonb_build_object('path', new.path),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-bot-secret', sec),
    timeout_milliseconds := 5000
  );
  return new;
end $$;

drop trigger if exists chat_notify on public.docs;
create trigger chat_notify after insert on public.docs
  for each row execute function public.chat_notify();
