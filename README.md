# English Classes

Application d'apprentissage de l'anglais pour le Togo : leçons du programme (CP1 → Terminale, université, adultes), quiz, jeux d'images 3D, conversation avec l'IA Nova, épreuves BEPC/BAC, suivi en temps réel par la professeure, notes trimestrielles, appel, espace parents.

- **Site en ligne** : `https://grace-shop.github.io/ma-classe-anglais/`
- **Application Android** : onglet **Releases** → `ma-classe-anglais.apk`
- **Guide d'installation complet** : [GUIDE.md](GUIDE.md)

## Mise en route (une seule fois)

1. Suivez les étapes 1 à 4 du [GUIDE](GUIDE.md) : projet Supabase, `supabase/schema.sql`, connexions Google/e-mail, serveur IA Gemini.
2. Ici sur GitHub : **Settings → Secrets and variables → Actions → onglet Variables → New repository variable** :
   - `SUPABASE_URL` = l'adresse de votre projet (https://xxxx.supabase.co)
   - `SUPABASE_ANON_KEY` = la clé publique « anon / publishable »
3. Si le site ne s'affiche pas : **Settings → Pages → Source : Deploy from a branch → gh-pages / (root)** → Save (une seule fois).
4. **Actions** → relancez les deux tâches (*Run workflow*) : le site et l'APK sont reconstruits avec vos réglages.
5. Dans Supabase → *Authentication → URL Configuration* : ajoutez `https://grace-shop.github.io/ma-classe-anglais/` et `tg.maclasse.anglais://login`.

À chaque modification poussée sur `main`, le site et l'application Android se reconstruisent automatiquement.

## Contenu du dépôt

| Dossier | Rôle |
|---|---|
| `www/` | L'application (site web et contenu de l'APK) |
| `supabase/schema.sql` | Base de données, comptes, règles de sécurité |
| `supabase/functions/ai/` | Serveur de l'IA Nova (Google Gemini) |
| `.github/workflows/` | Publication du site et fabrication de l'APK |
| `source-english-class.html`, `build.py` | Source de l'application et reconstruction de `www/index.html` (`python3 build.py`) |
| `app-v4.js`, `scripts/inject-v4.py` | Dernières fonctions (messageries riches, visionneuse, dossiers, Nova…) insérées dans la source |
| `supabase/LISEZMOI.md` | Ordre des fichiers SQL et des fonctions serveur |
| `contenu/` | Programme togolais et épreuves types (déjà inclus dans `www/content.json`) |
