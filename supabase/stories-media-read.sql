-- =====================================================================
--  STORIES : lire la photo / vidéo d'une story visible
--  À exécuter une fois dans Supabase > SQL Editor (après messagerie.sql et stories-24h.sql).
--
--  Problème : la lecture du stockage "chat" exigeait le niveau 2 (interact).
--  Un élève au niveau "view" voit le texte des stories, mais son fichier
--  photo/vidéo est refusé, et l'app n'affiche rien.
--
--  Correction : on autorise la lecture d'un fichier de chat si ce fichier
--  appartient à une story encore visible pour la personne (même règle que
--  la table stories : 24 h, non supprimée, non masquée, feed_ok()).
--  Le niveau 2 garde l'accès à tout le reste du chat.
-- =====================================================================

drop policy if exists "chat_read" on storage.objects;
create policy "chat_read" on storage.objects for select to authenticated
  using (bucket_id = 'chat' and (
           public.my_level() >= 2
           or (public.feed_ok() and exists (
                 select 1 from public.stories s
                 where (s.media->>'p' = storage.objects.name
                        or s.media->'poster'->>'p' = storage.objects.name
                        or s.music->>'b' = storage.objects.name)
                   and s.deleted_at is null
                   and (s.hide is null or s.hide <> auth.uid())
                   and s.created_at > now() - interval '24 hours')) ));
