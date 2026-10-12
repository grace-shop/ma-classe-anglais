-- =====================================================================
--  NOTIFICATIONS PUSH : un jeton par téléphone, pour prévenir un élève
--  quand il reçoit un message ou un appel (même application fermée).
--  À exécuter APRÈS messagerie.sql et appels.sql.
--  L'envoi est fait par la fonction « push » (supabase/functions/push),
--  qui lit les jetons avec la clé de service : aucun élève ne peut lire
--  les jetons des autres.
-- =====================================================================

create table if not exists public.push_tokens (
  token      text primary key,
  uid        uuid not null references auth.users(id) on delete cascade,
  platform   text not null default 'android',
  updated_at timestamptz not null default now()
);
create index if not exists push_tokens_uid_idx on public.push_tokens (uid);
alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from anon, authenticated;

-- l'application enregistre le jeton du téléphone connecté
create or replace function public.save_push_token(p_token text, p_platform text default 'android')
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_token is null or char_length(p_token) < 20 or char_length(p_token) > 500 then raise exception 'bad token'; end if;
  insert into public.push_tokens (token, uid, platform, updated_at)
  values (p_token, auth.uid(), left(coalesce(p_platform, 'android'), 20), now())
  on conflict (token) do update set uid = excluded.uid, platform = excluded.platform, updated_at = now();
end $$;

revoke all on function public.save_push_token(text, text) from public, anon;
grant execute on function public.save_push_token(text, text) to authenticated;
