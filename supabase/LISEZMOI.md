# Base de données English Classes (Supabase)

Chaque fichier se colle dans **Supabase → SQL Editor → New query → Run**. Tous peuvent être relancés sans risque : ils ne suppriment aucune donnée.

Ordre pour une nouvelle installation :

| # | Fichier | Rôle |
|---|---|---|
| 1 | `schema.sql` | Tables, comptes, règles d'accès, temps réel, limite de Nova |
| 2 | `copies.sql` | Photos et PDF des copies d'élèves (dossier privé) |
| 3 | `security-update.sql` | Appareils suspendus, sécurité |
| 4 | `xp-guard.sql` | Verrou de l'XP |
| 5 | `single-device.sql` | Limite d'appareils par compte |
| 6 | `hardening.sql` | Durcissement des fonctions internes |
| 7 | `securite.sql` | Notes, XP dépensés et récompenses protégés |
| 8 | `messagerie.sql` | Messages entre apprenants, vocaux, photos, fichiers, stickers, photos de profil |

## Fonctions serveur (Edge Functions)

| Dossier | Nom de la fonction dans Supabase | Rôle |
|---|---|---|
| `functions/ai/index.ts` | `ai` | Nova (Gemini) + réinitialisation des mots de passe par la professeure |
| `functions/grade/index.ts` | `grade` | Correction automatique des copies par Nova |

Pour chaque fonction : Edge Functions → la fonction → Code → coller tout le fichier → Deploy, avec « Verify JWT » désactivé.
