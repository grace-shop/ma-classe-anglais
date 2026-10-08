-- =====================================================================
--  MESSAGERIE COMPLÈTE : camarades + vocaux, photos, fichiers, stickers
--  + PHOTOS DE PROFIL des apprenants
--  À exécuter dans Supabase > SQL Editor (peut être relancé sans risque).
--  (Remplace l'ancien fichier peer.sql.)
--  Règles appliquées par le SERVEUR :
--   • messages entre élèves actifs de l'école (pas les parents, pas le primaire)
--   • 1000 caractères maximum, 15 messages par minute, 400 par jour
--   • pièces jointes : dossier privé « chat », 10 Mo maximum, chacun écrit
--     uniquement dans son propre dossier
--   • la professeure peut masquer un message ou couper le chat d'un élève ;
--     réglage général : settings/main → peerChat = false coupe tout le chat
-- =====================================================================

create table if not exists public.peer_messages (
  id         uuid primary key default gen_random_uuid(),
  sender     uuid not null references auth.users(id) on delete cascade,
  receiver   uuid not null references auth.users(id) on delete cascade,
  body       text not null default '',
  created_at timestamptz not null default now(),
  read_at    timestamptz,
  hidden     boolean not null default false
);
alter table public.peer_messages add column if not exists att jsonb;
alter table public.peer_messages alter column body set default '';
alter table public.peer_messages drop constraint if exists peer_messages_body_check;
alter table public.peer_messages add constraint peer_messages_body_check check (char_length(body) <= 1000);
create index if not exists peer_messages_recv_idx on public.peer_messages (receiver, created_at desc);
create index if not exists peer_messages_send_idx on public.peer_messages (sender, created_at desc);
alter table public.peer_messages enable row level security;

create or replace function public.peer_staff_sees(p_sender uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when public.my_level() >= 4 then true
    when public.my_level() = 3 then exists (select 1 from docs where path = 'students/' || p_sender::text and data->>'teacherId' = auth.uid()::text)
    else false end
$$;

drop policy if exists peer_select on public.peer_messages;
create policy peer_select on public.peer_messages for select to authenticated
  using ((public.my_level() = 2 and not hidden and auth.uid() in (sender, receiver)) or public.peer_staff_sees(sender));
drop policy if exists peer_staff_update on public.peer_messages;
create policy peer_staff_update on public.peer_messages for update to authenticated
  using (public.peer_staff_sees(sender)) with check (public.peer_staff_sees(sender));

revoke all on public.peer_messages from anon, authenticated;
grant select on public.peer_messages to authenticated;
grant update (hidden) on public.peer_messages to authenticated;

create or replace function public.peer_enabled() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select data->>'peerChat' from docs where path = 'settings/main'), 'true') <> 'false'
$$;

create or replace function public.peer_ok(u uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare lvl text; sd jsonb; ad jsonb; appr text; st text;
begin
  select level into lvl from members where uid = u;
  if coalesce(lvl, 'interact') <> 'interact' then return false; end if;
  select data into sd from docs where path = 'students/' || u::text;
  if sd is null then return false; end if;
  if coalesce(sd->>'profile', '') in ('primaire', 'parent') then return false; end if;
  select data into ad from docs where path = 'access/' || u::text;
  select data->>'approve' into appr from docs where path = 'settings/main';
  st := coalesce(ad->>'status', case when appr = 'false' then 'active' else 'pending' end);
  if st <> 'active' then return false; end if;
  if coalesce(ad->>'noChat', '') = 'true' then return false; end if;
  return true;
end $$;

-- Tous les apprenants actifs de l'école (les camarades de la même professeure d'abord)
drop function if exists public.peer_directory();
create or replace function public.peer_directory() returns table(uid uuid, name text, classe text, same boolean)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); mt text;
begin
  if me is null or public.my_level() <> 2 or not public.peer_enabled() or not public.peer_ok(me) then return; end if;
  select coalesce(data->>'teacherId', '') into mt from docs where path = 'students/' || me::text;
  return query
    select d.id::uuid, coalesce(d.data->>'name', 'Élève'), coalesce(d.data->>'classe', ''), coalesce(d.data->>'teacherId', '') = coalesce(mt, '')
    from docs d
    where d.col = 'students' and d.id <> me::text
      and d.id ~ '^[0-9a-fA-F-]{36}$' and public.peer_ok(d.id::uuid)
    order by 4 desc, 2 limit 5000;
end $$;

drop function if exists public.send_peer_message(uuid, text, jsonb);
create or replace function public.send_peer_message(p_to uuid, p_body text, p_att jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); b text := btrim(coalesce(p_body, '')); n int; id uuid; k text; a jsonb := null;
begin
  if me is null or public.my_level() <> 2 then raise exception 'Accès refusé'; end if;
  if not public.peer_enabled() then raise exception 'Le chat entre élèves est désactivé par ta professeure'; end if;
  if p_to = me then raise exception 'Tu ne peux pas t''écrire à toi-même'; end if;
  if not public.peer_ok(me) then raise exception 'Le chat est désactivé pour ton compte'; end if;
  if not public.peer_ok(p_to) then raise exception 'Cet élève ne peut pas recevoir de messages'; end if;
  if p_att is not null and jsonb_typeof(p_att) = 'object' then
    k := p_att->>'k';
    if k = 'sticker' then
      if coalesce(p_att->>'e', '') !~ '^[0-9a-f-]{2,60}$' then raise exception 'Sticker invalide'; end if;
      a := jsonb_build_object('k', 'sticker', 'e', p_att->>'e');
    elsif k in ('voice', 'img', 'file') then
      if coalesce(p_att->>'p', '') not like me::text || '/%' then raise exception 'Fichier invalide'; end if;
      a := jsonb_build_object('k', k, 'p', p_att->>'p', 't', left(coalesce(p_att->>'t', ''), 120), 'n', left(coalesce(p_att->>'n', ''), 80),
                              's', coalesce((p_att->>'s')::bigint, 0), 'd', coalesce((p_att->>'d')::int, 0));
    else raise exception 'Pièce jointe invalide'; end if;
  end if;
  if char_length(b) < 1 and a is null then raise exception 'Message vide'; end if;
  if char_length(b) > 1000 then raise exception 'Message trop long (1000 caractères maximum)'; end if;
  select count(*) into n from peer_messages where sender = me and created_at > now() - interval '1 minute';
  if n >= 15 then raise exception 'Tu écris trop vite : attends une minute'; end if;
  select count(*) into n from peer_messages where sender = me and created_at > now() - interval '1 day';
  if n >= 400 then raise exception 'Limite de messages atteinte pour aujourd''hui'; end if;
  insert into peer_messages(sender, receiver, body, att) values (me, p_to, b, a) returning peer_messages.id into id;
  return id;
end $$;

-- ancienne version (texte seul), gardée pour les anciennes applications
create or replace function public.send_peer_message(p_to uuid, p_body text) returns uuid
language sql security definer set search_path = public as $$ select public.send_peer_message(p_to, p_body, null::jsonb) $$;

create or replace function public.mark_peer_read(p_from uuid) returns void
language sql security definer set search_path = public as $$
  update peer_messages set read_at = now() where receiver = auth.uid() and sender = p_from and read_at is null and public.my_level() = 2;
$$;

revoke all on function public.peer_ok(uuid), public.peer_staff_sees(uuid), public.peer_enabled() from public, anon;
revoke all on function public.peer_directory(), public.send_peer_message(uuid, text), public.send_peer_message(uuid, text, jsonb), public.mark_peer_read(uuid) from public, anon;
grant execute on function public.peer_directory(), public.send_peer_message(uuid, text), public.send_peer_message(uuid, text, jsonb), public.mark_peer_read(uuid) to authenticated;
grant execute on function public.peer_staff_sees(uuid) to authenticated;

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.peer_messages;
    exception when duplicate_object then null; end;
  end if;
end $$;

-- ---------- Pièces jointes des messageries : dossier PRIVÉ « chat » ----------
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('chat', 'chat', false, 10485760, array[
      'image/jpeg','image/png','image/webp','image/gif','application/pdf',
      'audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/aac','audio/x-m4a','audio/wav','video/mp4','text/plain',
      'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'])
    on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
    drop policy if exists "chat_insert_own" on storage.objects;
    drop policy if exists "chat_read" on storage.objects;
    drop policy if exists "chat_delete" on storage.objects;
    create policy "chat_insert_own" on storage.objects for insert to authenticated
      with check (bucket_id = 'chat' and (storage.foldername(name))[1] = auth.uid()::text and public.my_level() >= 2);
    create policy "chat_read" on storage.objects for select to authenticated
      using (bucket_id = 'chat' and public.my_level() >= 2);
    create policy "chat_delete" on storage.objects for delete to authenticated
      using (bucket_id = 'chat' and ((storage.foldername(name))[1] = auth.uid()::text or public.my_level() >= 3));
  end if;
end $$;

-- ---------- Photos de profil : dossier PUBLIC « avatars » (chacun ne modifie que sa photo) ----------
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('avatars', 'avatars', true, 1048576, array['image/jpeg','image/png','image/webp'])
    on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
    drop policy if exists "avatars_insert_own" on storage.objects;
    drop policy if exists "avatars_update_own" on storage.objects;
    drop policy if exists "avatars_delete" on storage.objects;
    drop policy if exists "avatars_read" on storage.objects;
    create policy "avatars_read" on storage.objects for select to authenticated using (bucket_id = 'avatars');
    create policy "avatars_insert_own" on storage.objects for insert to authenticated
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and public.my_level() >= 2);
    create policy "avatars_update_own" on storage.objects for update to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
    create policy "avatars_delete" on storage.objects for delete to authenticated
      using (bucket_id = 'avatars' and ((storage.foldername(name))[1] = auth.uid()::text or public.my_level() >= 3));
  end if;
end $$;
