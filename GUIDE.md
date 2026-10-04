# Ma Classe d'Anglais — installer votre propre application

Ce dossier contient **votre application à vous**, indépendante de Claude :

| Élément | Rôle | Où ? |
|---|---|---|
| `www/` | L'application (la même que dans Claude) | Site web + application Android |
| `supabase/schema.sql` | La base de données, les comptes, les règles de sécurité | Supabase |
| `supabase/functions/ai/index.ts` | Le serveur de Nova (IA Gemini) | Supabase |
| `www/config.js` | Vos réglages (adresse et clé de votre projet) | À remplir |
| `www/content.json` | Le contenu de départ : 97 leçons, 94 quiz, 18 listes de mots, 5 épreuves | Installé à la 1re connexion |
| `package.json`, `capacitor.config.json`, `android-extras/` | L'application Android installable | Votre ordinateur |

Les élèves, les notes, l'appel, les messages, les parents, le quiz en direct… tout fonctionne comme dans la version Claude, avec les mêmes règles de sécurité : un élève ne voit jamais les données d'un autre élève, et seule la professeure voit les corrigés.

Comptez **environ 1 h** la première fois. Aucune compétence en programmation n'est nécessaire pour les étapes 1 à 7 ; l'étape 8 (application Android) demande un ordinateur.

---

## Étape 1 — Créer le projet Supabase (gratuit)

1. Allez sur **supabase.com** → *Start your project* → connectez-vous (avec GitHub ou e-mail).
2. *New project* : nom `ma-classe-anglais`, choisissez un mot de passe de base de données (notez-le), région **Europe (Frankfurt ou Ireland)** — la plus proche du Togo.
3. Attendez 2 minutes que le projet soit prêt.

## Étape 2 — Créer la base de données

1. Ouvrez `supabase/schema.sql` avec un éditeur de texte (Bloc-notes suffit).
2. Ligne 20 : remplacez `VOTRE-EMAIL@gmail.com` par **l'e-mail de la professeure principale** (celle qui gère tout).
3. Dans Supabase : menu de gauche **SQL Editor** → *New query* → collez tout le fichier → **Run**.
4. Vous devez voir « Success. No rows returned ». C'est tout : tables, règles d'accès, temps réel, stockage des photos et limite de Nova sont créés.

> Vous pouvez relancer ce fichier sans risque : il ne supprime aucune donnée.

## Étape 3 — Les connexions (Google + e-mail)

**E-mail et mot de passe** — déjà activé. Un réglage important :
*Authentication → Sign In / Providers → Email* : désactivez **Confirm email**.
Pourquoi : l'envoi d'e-mails gratuit de Supabase est limité à quelques messages par heure ; comme la professeure valide déjà chaque inscription dans l'application, la confirmation par e-mail n'est pas nécessaire. (Pour l'activer plus tard, branchez un service d'e-mails dans *Authentication → Emails → SMTP*.)

**Google** :
1. Allez sur **console.cloud.google.com** → créez un projet → *APIs & Services → OAuth consent screen* : type *External*, nom de l'application, votre e-mail → enregistrez.
2. *Credentials → Create credentials → OAuth client ID* → type **Web application**.
3. Dans *Authorized redirect URIs*, ajoutez : `https://VOTRE-PROJET.supabase.co/auth/v1/callback` (l'adresse exacte est affichée dans Supabase, page du fournisseur Google).
4. Copiez le **Client ID** et le **Client secret**.
5. Supabase → *Authentication → Sign In / Providers → Google* → activez, collez les deux valeurs → *Save*.

## Étape 4 — Nova, l'IA (Google Gemini)

1. Allez sur **aistudio.google.com** → connectez-vous avec un compte Google → **Get API key** → *Create API key*. Copiez la clé.
2. Supabase → **Edge Functions** → *Deploy a new function* → *Via Editor*. Nom : **`ai`** (exactement). Effacez l'exemple, collez tout le contenu de `supabase/functions/ai/index.ts` → **Deploy**.
3. Supabase → *Edge Functions → Secrets* → *Add new secret* : nom `GEMINI_API_KEY`, valeur = votre clé → *Save*.

Réglages facultatifs (mêmes écrans *Secrets*) :
- `GEMINI_MODEL` (par défaut `gemini-3.8-flash`) et `GEMINI_MODEL_QUICK` (par défaut `gemini-3.5-flash-lite`, utilisé pour la conversation). Les noms des modèles changent avec le temps : vérifiez-les sur ai.google.dev → *Models*.
- La limite de messages par jour se règle dans la base : *Table Editor → app_config* → `ai_daily_limit_student` (120) et `ai_daily_limit_teacher` (600).

**Coût et vie privée — à lire.** Gemini a une **offre gratuite**, mais Google peut alors utiliser les conversations pour améliorer ses produits. Comme vos utilisateurs sont souvent mineurs, nous vous conseillons d'activer la **facturation** dans Google AI Studio (*Billing*) : les conversations ne sont alors plus utilisées par Google, et le coût reste faible (Gemini 3.5 Flash-Lite : 0,30 $ par million de jetons envoyés et 2,50 $ par million de jetons reçus, un million de jetons représentant environ 700 000 mots ; un échange avec un élève coûte une fraction de centime). Fixez un plafond de dépenses dans Google Cloud.

## Étape 5 — Remplir `www/config.js`

Supabase → *Project Settings → API* (ou bouton **Connect** en haut) :
- **Project URL** → `supabaseUrl`
- **anon / public key** (ou *publishable key*) → `supabaseAnonKey`

⚠️ Ne mettez **jamais** la clé `service_role` / *secret* dans ce fichier : elle donne tous les droits.

## Étape 6 — Mettre le site en ligne (gratuit, déjà prêt sur GitHub)

Le dépôt GitHub **grace-shop/ma-classe-anglais** publie le site et fabrique l'application Android tout seul.

1. GitHub → dépôt → **Settings → Secrets and variables → Actions → onglet Variables** → *New repository variable* :
   - `SUPABASE_URL` = votre Project URL
   - `SUPABASE_ANON_KEY` = votre clé publique anon / publishable
   (Plus besoin de modifier `www/config.js` à la main.)
2. **Settings → Pages → Build and deployment → Source : GitHub Actions** (une seule fois).
3. **Actions** → *Site en ligne (GitHub Pages)* → **Run workflow**. Deux minutes plus tard, le site est en ligne à :
   **https://grace-shop.github.io/ma-classe-anglais/**
4. Supabase → *Authentication → URL Configuration* :
   - **Site URL** : `https://grace-shop.github.io/ma-classe-anglais/`
   - **Redirect URLs** : la même adresse **et** `tg.maclasse.anglais://login`

Sur un téléphone Android, ouvrez le site dans Chrome → menu ⋮ → **Ajouter à l'écran d'accueil** : l'application s'installe avec son icône. Le micro fonctionne directement dans Chrome.

Autre possibilité sans GitHub : glissez le dossier `www` (avec `config.js` rempli) sur **app.netlify.com/drop**.

## Étape 7 — Premier démarrage

1. Ouvrez votre site, connectez-vous **avec l'e-mail de la professeure principale** (celui de l'étape 2).
2. L'application propose **« Installer le contenu de départ »** → acceptez (30 secondes).
3. Partagez l'adresse aux élèves, parents et professeurs : chacun crée son compte, choisit sa catégorie (primaire, collège, lycée, étudiant, adulte, parent ou professeur), puis vous validez son inscription dans *Classe*.
4. Un professeur qui s'inscrit avec « Je suis professeur » apparaît dans *Classe → Professeurs* : quand vous l'acceptez, il reçoit automatiquement les droits de professeur (ses élèves, son contenu, ses copies).

Si la prof principale s'est inscrite avant l'étape 2, exécutez dans *SQL Editor* :
`update public.members set level = 'owner' where email = 'son-email@gmail.com';`

## Étape 8 — L'application Android (.apk)

**Automatique avec GitHub** : à chaque modification, la tâche *Application Android (APK)* fabrique l'application. Après avoir rempli les variables de l'étape 6, relancez-la (**Actions → Application Android (APK) → Run workflow**). Le fichier apparaît dans **Releases → Application Android — dernière version → ma-classe-anglais.apk**.
Lien direct à partager : `https://github.com/grace-shop/ma-classe-anglais/releases/latest/download/ma-classe-anglais.apk`

Sur le téléphone : ouvrez le lien, téléchargez, ouvrez le fichier et acceptez « Installer des applications inconnues ». Au premier usage du micro, le téléphone demande « Autoriser l'enregistrement audio ? ».

Cette version (« debug ») s'installe directement mais ne peut pas aller sur le Play Store. Pour le Play Store (compte développeur 25 $ une seule fois), il faut une version signée : ouvrez le projet dans Android Studio (`npm install`, `npx cap add android`, `npm run android`) puis *Build → Generate Signed App Bundle*.

---

## Bon à savoir

- **Projet gratuit en pause** : sur l'offre gratuite de Supabase, un projet sans aucune connexion pendant 7 jours est mis en pause (vacances !). Il suffit de cliquer *Restore* dans Supabase ; aucune donnée n'est perdue. L'offre Pro (25 $/mois) supprime les pauses.
- **Limites gratuites Supabase** : 500 Mo de base (des milliers d'élèves), 1 Go de photos, 50 000 utilisateurs actifs par mois, 500 000 appels à Nova par mois côté serveur.
- **Sauvegardes** : *Database → Backups* (quotidiennes sur l'offre Pro) ; sur l'offre gratuite, exportez de temps en temps la table `docs` (*Table Editor → docs → Export to CSV*).
- **Mettre à jour l'application** : la version Claude reste votre atelier. Quand elle change, le fichier `build.py` reconstruit `www/index.html` à partir de la page (`python build.py source-english-class.html`).
- **Sécurité** : les règles d'accès sont dans la base elle-même (table `access_rules` + politiques RLS). Même quelqu'un qui modifierait l'application sur son téléphone ne pourrait pas lire les copies ou les notes des autres.
