# Guide pas-à-pas — Créer la base Supabase (pour MedWork)

> Suis ces étapes dans l'ordre. À la fin, tu auras une **chaîne de connexion** à me transmettre
> (ou à coller toi-même dans un fichier), et je m'occupe de tout le reste.
> ⏱️ Durée : ~10 minutes.

---

## Étape 1 — Créer le compte Supabase

1. Va sur **https://supabase.com**
2. Clique sur **« Start your project »** (en haut à droite).
3. Connecte-toi avec **GitHub** (recommandé, tu as déjà un compte `warisjabari-ai`)
   ou avec ton email **warisjabari@gmail.com**.

## Étape 2 — Créer le projet

1. Clique sur **« New project »**.
2. Remplis :
   - **Name** : `medwork`
   - **Database Password** : clique sur **« Generate a password »** puis **copie-le et garde-le en lieu sûr**
     (tu en auras besoin — note-le dans un endroit sécurisé).
   - **Region** : choisis **« West EU (Ireland) »** ou **« Central EU (Frankfurt) »**
     (les plus proches de la Guinée).
   - **Plan** : **Free**.
3. Clique sur **« Create new project »** et **attends ~2 minutes** que la base soit prête
   (l'écran affiche « Setting up project… »).

## Étape 3 — Récupérer la chaîne de connexion

1. En haut de la page du projet, clique sur le bouton **« Connect »**
   (ou : menu de gauche → ⚙️ **Project Settings** → **Database**).
2. Cherche la section **« Connection string »**.
3. Choisis l'onglet **« Session pooler »** (important : c'est celui qui fonctionne avec Render).
4. Tu verras une ligne qui ressemble à :
   ```
   postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
   ```
5. **Copie cette ligne**, puis **remplace `[YOUR-PASSWORD]`** par le mot de passe que tu as généré à l'étape 2.

## Étape 4 — Me transmettre la connexion (2 options)

### Option A — Tu me la donnes dans le chat (le plus simple)
Colle-moi la chaîne complète. Je l'utiliserai pour créer les tables et les comptes de démo.
> 🔒 C'est ta propre machine et ta propre session ; la chaîne reste locale. On régénérera de toute
> façon les accès en production.

### Option B — Tu la mets toi-même dans le fichier (plus confidentiel)
Ouvre le fichier `med-work/backend/.env` et remplace la ligne `DATABASE_URL=...` par :
```
DATABASE_URL="<la chaîne que tu as copiée>"
```
Puis dis-moi simplement « c'est fait », et je lancerai les commandes sans voir le secret.

---

## Ce que JE ferai ensuite (automatiquement)

1. ✅ Créer toutes les tables sur Supabase (`prisma migrate deploy`).
2. ✅ Créer les rôles et les comptes de démo (`npm run db:seed`) :
   - `admin` / `Admin@2026!` → Administrateur
   - `icamara` / `Medecin@2026` → Médecin du travail
   - …et les autres.
3. ✅ Vérifier que tout est en place (connexion test).
4. ✅ Te guider pour déployer l'API sur **Render** (étape suivante).

---

## Étape suivante (après Supabase) — Render

Une fois la base prête, on déploiera le backend sur Render. Je te préparerai un guide similaire.
Tu auras juste besoin de :
- Un compte Render (gratuit, connexion via GitHub).
- Connecter le dossier `med-work` (il faudra qu'il soit sur GitHub — on verra ça ensemble).
