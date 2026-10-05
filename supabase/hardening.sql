-- =====================================================================
--  Ma Classe d'Anglais — DURCISSEMENT + SUSPENSION (à exécuter une fois)
--  Supabase → SQL Editor → New query → coller → Run.  Relançable sans risque.
--  À exécuter APRÈS schema.sql, security-update.sql, xp-guard.sql et single-device.sql.
--  1) Ferme les fonctions internes (IA, triggers) à tout utilisateur connecté.
--  2) Coupe l'accès « anonyme » aux tables.
--  3) Quand la prof suspend un élève : toutes ses connexions sont fermées tout de suite.
--  4) Journal des suspensions (visible seulement par la prof principale).
-- =====================================================================

-- 1) Fonctions internes : réservées au serveur
revoke all on function public.ai_take(uuid)        from public, anon, authenticated;
revoke all on function public.handle_new_user()    from public, anon, authenticated;
revoke all on function public.sync_staff_level()   from public, anon, authenticated;
revoke all on function public.guard_student_xp()   from public, anon, authenticated;

-- 2) Aucun accès pour les visiteurs non connectés
revoke all on public.docs, public.members, public.app_config, public.access_rules,
              public.ai_usage, public.xp_daily, public.device_lock from anon;
revoke all on public.app_config, public.access_rules, public.ai_usage,
              public.xp_daily, public.device_lock from authenticated;

-- 3) Journal des suspensions
create table if not exists public.audit_log (
  id    bigserial primary key,
  at    timestamptz not null default now(),
  actor uuid,
  path  text,
  state text,
  data  jsonb
);
alter table public.audit_log enable row level security;
drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select using (public.my_level() >= 4);
revoke all on public.audit_log from anon;
grant select on public.audit_log to authenticated;

create or replace function public.on_access_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare u uuid; st text; old_st text;
begin
  if new.col <> 'access' then return new; end if;
  st := new.data->>'status';
  old_st := case when tg_op = 'UPDATE' then old.data->>'status' else null end;
  insert into audit_log(actor, path, state, data)
    values (auth.uid(), new.path, st, jsonb_build_object('blockedDevices', new.data->'blockedDevices', 'deviceLimit', new.data->'deviceLimit'));
  -- Élève suspendu ou refusé : on le déconnecte partout et on libère son verrou
  if st in ('blocked', 'refused') and st is distinct from old_st then
    begin
      u := new.id::uuid;
      delete from device_lock where uid = u;
      begin delete from auth.sessions where user_id = u;
      exception when others then null; end;
    exception when others then null;
    end;
  end if;
  return new;
end $$;
revoke all on function public.on_access_change() from public, anon, authenticated;
drop trigger if exists zz_docs_access_audit on public.docs;
create trigger zz_docs_access_audit after insert or update on public.docs
  for each row execute function public.on_access_change();

-- 4) Nettoyage régulier
delete from public.audit_log where at < now() - interval '180 days';
