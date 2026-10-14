-- Publication automatique des nouvelles vidéos YouTube dans « Posts ».
-- À exécuter une fois : Supabase → SQL Editor → New query → coller → Run.
-- Cette table retient les vidéos déjà publiées pour ne jamais les publier deux fois.
create table if not exists public.yt_seen (
  video_id   text primary key,
  channel    text not null default '',
  post_id    uuid,
  created_at timestamptz not null default now()
);
alter table public.yt_seen enable row level security;
-- aucune règle d'accès : seule la fonction « youtube-sync » (clé service) y écrit.
