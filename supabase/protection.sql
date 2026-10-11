-- =====================================================================
-- English Classes · protection des fichiers (épreuves, images, fichiers de devoirs)
-- À exécuter EN DERNIER, une fois la nouvelle version de l'application publiée.
-- Effet : le bucket "assets" n'est plus public. Un lien n'ouvre plus un fichier sans
-- compte connecté, et chaque lien expire au bout d'une heure (l'application en crée un
-- nouveau à chaque ouverture). Idempotent.
-- =====================================================================

update storage.buckets set public = false where id = 'assets';

drop policy if exists assets_read_signed on storage.objects;
create policy assets_read_signed on storage.objects
  for select to authenticated
  using (bucket_id = 'assets' and public.my_level() >= 2);
