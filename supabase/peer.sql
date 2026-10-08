-- =====================================================================
--  MESSAGES ENTRE ÉLÈVES (camarades de la même professeure)
--  À exécuter dans Supabase > SQL Editor (peut être relancé sans risque).
--  Règles appliquées par le SERVEUR :
--   • élèves actifs uniquement (pas les professeurs, pas les parents, pas les écoliers du primaire)
--   • seulement entre élèves de la même professeure
--   • 500 caractères maximum, 15 messages par minute, 400 par jour
--   • la professeure lit tout, peut masquer un message ou désactiver le chat d'un élève
--   • réglage général : settings/main → peerChat = false coupe tout le chat
-- =====================================================================
create table if not exists public.peer_messages (
  id         uuid primary key default gen_random_uuid(),
  sender     uuid not null references auth.users(id) on delete cascade,
  receiver   uuid not null references auth.users(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  read_at    timestamptz,
  hidden     boolean not null default false
);
create index if not exists peer_messages_recv_idx on public.peer_messages (receiver, created_at desc);
create index if not exists peer_messages_send_idx on public.peer_messages (sender, created_at desc);
alter table public.peer_messages enable row level security;

-- La professeure voit les messages de SES élèves ; la prof principale voit tout
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

-- Cet élève peut-il écrire / recevoir ?
create or replace function public.peer_ok(u uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare lvl text; sd jsonb; ad jsonb; appr text; st text;
begin
  select level into lvl from members where uid = u;
  if coalesce(lvl, 'interact') <> 'interact' then return false; end if;
  select data into sd from docs where path = 'students/' || u::text;
  if sd is null then return false; end if;
  if coalesce(sd->>'profile', '') = 'primaire' then return false; end if;
  select data into ad from docs where path = 'access/' || u::text;
  select data->>'approve' into appr from docs where path = 'settings/main';
  st := coalesce(ad->>'status', case when appr = 'false' then 'active' else 'pending' end);
  if st <> 'active' then return false; end if;
  if coalesce(ad->>'noChat', '') = 'true' then return false; end if;
  return true;
end $$;

-- Liste des camarades avec qui je peux discuter
create or replace function public.peer_directory() returns table(uid uuid, name text, classe text)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); mt text;
begin
  if me is null or public.my_level() <> 2 or not public.peer_enabled() or not public.peer_ok(me) then return; end if;
  select coalesce(data->>'teacherId', '') into mt from docs where path = 'students/' || me::text;
  return query
    select d.id::uuid, coalesce(d.data->>'name', 'Élève'), coalesce(d.data->>'classe', '')
    from docs d
    where d.col = 'students' and d.id <> me::text and coalesce(d.data->>'teacherId', '') = coalesce(mt, '')
      and d.id ~ '^[0-9a-fA-F-]{36}$' and public.peer_ok(d.id::uuid)
    order by 2 limit 300;
end $$;

-- Envoyer un message
create or replace function public.send_peer_message(p_to uuid, p_body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); b text := btrim(coalesce(p_body, '')); n int; id uuid;
begin
  if me is null or public.my_level() <> 2 then raise exception 'Accès refusé'; end if;
  if not public.peer_enabled() then raise exception 'Le chat entre élèves est désactivé par ta professeure'; end if;
  if p_to = me then raise exception 'Tu ne peux pas t''écrire à toi-même'; end if;
  if not public.peer_ok(me) then raise exception 'Le chat est désactivé pour ton compte'; end if;
  if not public.peer_ok(p_to) then raise exception 'Cet élève ne peut pas recevoir de messages'; end if;
  if coalesce((select data->>'teacherId' from docs where path = 'students/' || me::text), '')
     <> coalesce((select data->>'teacherId' from docs where path = 'students/' || p_to::text), '') then
    raise exception 'Cet élève n''est pas dans ta classe'; end if;
  if char_length(b) < 1 then raise exception 'Message vide'; end if;
  if char_length(b) > 500 then raise exception 'Message trop long (500 caractères maximum)'; end if;
  select count(*) into n from peer_messages where sender = me and created_at > now() - interval '1 minute';
  if n >= 15 then raise exception 'Tu écris trop vite : attends une minute'; end if;
  select count(*) into n from peer_messages where sender = me and created_at > now() - interval '1 day';
  if n >= 400 then raise exception 'Limite de messages atteinte pour aujourd''hui'; end if;
  insert into peer_messages(sender, receiver, body) values (me, p_to, b) returning peer_messages.id into id;
  return id;
end $$;

create or replace function public.mark_peer_read(p_from uuid) returns void
language sql security definer set search_path = public as $$
  update peer_messages set read_at = now() where receiver = auth.uid() and sender = p_from and read_at is null and public.my_level() = 2;
$$;

revoke all on function public.peer_ok(uuid), public.peer_staff_sees(uuid), public.peer_enabled() from public, anon;
revoke all on function public.peer_directory(), public.send_peer_message(uuid, text), public.mark_peer_read(uuid) from public, anon;
grant execute on function public.peer_directory(), public.send_peer_message(uuid, text), public.mark_peer_read(uuid) to authenticated;
grant execute on function public.peer_staff_sees(uuid) to authenticated;

-- Temps réel
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.peer_messages;
    exception when duplicate_object then null; end;
  end if;
end $$;
