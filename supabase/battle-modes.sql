-- =====================================================================
--  ARENA BATTLES : nouveaux modes de jeu (à exécuter APRÈS supabase/battle.sql)
--  Sans danger à relancer.
--
--  Les nouveaux défis (phrases à trous, mot intrus, questions par thème)
--  utilisent l'écran à choix multiples existant : aucun changement de
--  fonction n'est nécessaire. Ce fichier ajoute seulement une règle pour
--  que la base n'accepte que les modes connus.
-- =====================================================================

alter table public.arena_rooms drop constraint if exists arena_rooms_mode_check;
alter table public.arena_rooms add constraint arena_rooms_mode_check
  check (mode in ('quiz', 'gap', 'odd', 'theme', 'fill', 'order', 'guess', 'clock'));

-- Rappel de sécurité (NON appliqué ici) :
-- arena_answer reçoit encore « p_ok » du téléphone : l'élève peut donc
-- envoyer une bonne réponse sans l'avoir trouvée. La correction devra être
-- vérifiée côté serveur (comparer la réponse à qs->idx->>'a') dans une
-- version suivante, avec une mise à jour de l'application en même temps.
