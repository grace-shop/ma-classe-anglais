-- Supprimer ses notifications (glisser une notification vers la gauche, ou « Delete all »).
-- À lancer une fois dans Supabase (SQL Editor). Sans ce fichier, la suppression reste sur le téléphone.
drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications for delete to authenticated using (uid = auth.uid());
grant delete on public.notifications to authenticated;
