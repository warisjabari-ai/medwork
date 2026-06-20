# Guide pas-à-pas — Déployer l'API MedWork sur Render

> Objectif : remettre le backend en ligne (gratuit, pérenne) et le connecter à Supabase.
> ⏱️ Durée : ~10 minutes. Le dépôt `medwork` contient déjà un `render.yaml` qui automatise la config.

---

## Étape 1 — Créer le compte Render

1. Va sur **https://render.com**
2. Clique **« Get Started »** → connecte-toi avec **GitHub** (compte `warisjabari-ai`).
3. Autorise Render à accéder à tes dépôts GitHub (tu peux limiter au dépôt `medwork`).

## Étape 2 — Déployer via le Blueprint (render.yaml)

1. Dans le dashboard Render, clique **« New + »** (en haut à droite) → **« Blueprint »**.
2. Sélectionne le dépôt **`warisjabari-ai/medwork`**.
3. Render détecte automatiquement le fichier `render.yaml` et propose de créer le service
   **`medwork-backend`**. Clique **« Apply »** / **« Create »**.

## Étape 3 — Renseigner les 2 variables secrètes

Render va demander les variables marquées « à renseigner » (les autres sont automatiques) :

| Variable | Valeur à mettre |
|----------|-----------------|
| **DATABASE_URL** | La chaîne de connexion Supabase — **copie-la depuis ton fichier `backend/.env`** (la ligne qui commence par `postgresql://postgres.jfatetfbgkxlyfsfboop:...`). C'est exactement la même. |
| **CORS_ORIGINS** | L'adresse de ton site Vercel, ex : `https://medwork-cbg-frontend.vercel.app` (on l'ajustera si besoin). |

> 🔒 `JWT_SECRET` est généré automatiquement et de façon sécurisée par Render (rien à faire).

4. Clique **« Apply »** pour lancer le déploiement.

## Étape 4 — Attendre le déploiement

- Render exécute : `npm install` → `prisma generate` → `prisma migrate deploy` → démarrage du serveur.
- ⏳ Compte ~3-5 minutes pour le premier déploiement.
- Quand c'est fini, le statut passe à **« Live »** (vert), et tu obtiens une URL du type :
  ```
  https://medwork-backend.onrender.com
  ```
- **Copie cette URL** et donne-la-moi (ou note-la).

## Étape 5 — Vérifier que l'API répond

Ouvre dans ton navigateur :
```
https://medwork-backend.onrender.com/api/health
```
Tu dois voir : `{"status":"ok","app":"MedWork",...}` ✅

> ⚠️ Sur le plan gratuit, après 15 min sans activité l'API s'endort. La 1ʳᵉ requête suivante
> met ~30-50 secondes à répondre (réveil). C'est normal et sans gravité.

---

## Étape suivante — Connecter le frontend Vercel à la nouvelle API

Une fois l'URL Render obtenue :
1. Va sur ton projet **Vercel** (le frontend `medwork`).
2. **Settings → Environment Variables**.
3. Ajoute / modifie :
   - **Name** : `VITE_API_URL`
   - **Value** : `https://medwork-backend.onrender.com` (ton URL Render, **sans** `/api` à la fin)
4. **Redeploy** le frontend (Deployments → ⋯ → Redeploy).

> ⚠️ Important : le projet Vercel est aujourd'hui connecté à l'ancien dépôt `medwork-cbg-frontend`,
> qui a été renommé en `medwork`. Vérifie dans **Vercel → Settings → Git** que le dépôt connecté est
> bien `warisjabari-ai/medwork`, et que le **Root Directory** est réglé sur **`frontend`**
> (puisque c'est maintenant un monorepo). Je te guiderai sur ce point.

---

## Récapitulatif de l'architecture cible

```
   Navigateur / iPhone
          │
          ▼
   Frontend (Vercel)  ──VITE_API_URL──►  API (Render)  ──DATABASE_URL──►  PostgreSQL (Supabase)
     dossier frontend/                   dossier backend/                  + données
```

Tout est gratuit. Plus de Railway. 🎉
