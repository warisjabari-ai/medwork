# PHASE 4 — Sortie de Railway : comparatif d'hébergement & plan de migration

> Objectif : remplacer Railway (plan gratuit expiré) par une solution **pérenne, peu/pas coûteuse**,
> qui héberge à la fois la **base PostgreSQL**, l'**API**, et le **stockage de fichiers** (photos/signatures).

---

## 1. Rappel des besoins MedWork

| Besoin | Détail |
|--------|--------|
| Base PostgreSQL | Schéma Prisma existant (~15 tables), migration directe possible |
| API backend | Express/Node, 11 routes, JWT |
| Stockage fichiers | Photos de profil + signatures (actuellement perdues à chaque redéploiement) |
| Auth | JWT maison aujourd'hui — peut rester, ou basculer sur l'auth managée |
| Budget | **Le plus proche de 0 €/mois possible**, sans surprise |
| Maintenance | Faible (utilisateur non-dev) |

---

## 2. Comparatif des 4 options

| Critère | **Supabase** ⭐ | **Neon** | **Coolify (auto-hébergé)** | **VPS classique** |
|---------|----------------|----------|----------------------------|-------------------|
| **Type** | Plateforme tout-en-un | Postgres serverless seul | PaaS auto-hébergé | Serveur brut |
| **PostgreSQL** | ✅ Inclus (managé) | ✅ Inclus (managé) | ⚠️ À installer soi-même | ⚠️ À installer soi-même |
| **Stockage fichiers** | ✅ Storage S3 inclus | ❌ (à ajouter ailleurs) | ⚠️ Volume local | ⚠️ Disque local |
| **Auth managée** | ✅ Incluse (option) | ❌ | ❌ | ❌ |
| **API auto / SDK** | ✅ REST+SDK auto | ❌ | ❌ | ❌ |
| **Coût plan gratuit** | 0 € (500 Mo BDD, 1 Go fichiers, 50k users) | 0 € (0,5 Go BDD) | 0 € *logiciel* mais VPS payant | ~4-6 €/mois |
| **Coût si on grandit** | 25 $/mois (Pro) | ~19 $/mois | Coût du VPS (~5 €) | ~5-20 €/mois |
| **Maintenance** | 🟢 Quasi nulle | 🟢 Faible (BDD) mais API à héberger ailleurs | 🔴 Élevée (tu gères le serveur) | 🔴 Élevée |
| **Mise en veille du gratuit** | BDD en pause après 1 sem. d'inactivité (réveil auto) | Idem (scale-to-zero) | Non | Non |
| **Effort de migration** | 🟢 Faible | 🟡 Moyen (héberger l'API à part) | 🔴 Important | 🔴 Important |
| **Risque "rebelote Railway"** | Faible | Faible (BDD) mais API ? | Tu maîtrises | Tu maîtrises |

### Lecture rapide
- **Neon** : excellent Postgres gratuit, mais **ne résout que la base** — il faut héberger l'API ailleurs
  (Render/Fly/Vercel Functions) et trouver une 3ᵉ solution pour les fichiers. → 3 prestataires à gérer.
- **Coolify / VPS** : pérennité maximale et coût maîtrisé, mais demandent d'**administrer un serveur Linux**
  (mises à jour, sécurité, sauvegardes). Inadapté à un utilisateur non-dev sans accompagnement continu.
- **Supabase** : couvre **base + fichiers + auth + API** d'un seul tenant, plan gratuit généreux, migration
  Prisma directe. C'est aussi la stack déjà retenue sur tes autres projets (OWO), donc cohérence et
  montée en compétence mutualisée.

---

## 3. Recommandation : **Supabase**

**Pourquoi :**
1. Résout d'un coup 3 risques critiques de l'audit : backend down (#1), fichiers volatils (#3), et permet
   de régénérer les secrets (#4).
2. Plan gratuit pérenne et suffisant pour le volume actuel (CBG = quelques centaines de travailleurs).
3. Migration du schéma Prisma **sans réécriture** : Prisma sait parler à Postgres Supabase nativement.
4. Cohérent avec ton écosystème (OWO est déjà sur Supabase).

**Seul point d'attention :** sur le plan gratuit, la base se met en pause après ~1 semaine sans activité
(réveil automatique à la 1ʳᵉ requête, quelques secondes de latence). Sans impact pour un usage quotidien.

---

## 4. Deux variantes de migration vers Supabase

| | **Variante A — Minimale (recommandée pour démarrer)** | **Variante B — Native Supabase (cible long terme)** |
|---|---|---|
| **Base** | Postgres Supabase | Postgres Supabase |
| **API** | On **garde l'Express actuel**, on le redéploie (Render/Fly gratuit) en pointant `DATABASE_URL` vers Supabase | On migre vers Supabase (RLS + API auto / Edge Functions), on supprime l'Express |
| **Auth** | JWT maison conservé | Supabase Auth |
| **Fichiers** | Supabase Storage (remplace le disque local) | Supabase Storage |
| **Effort** | 🟢 Faible — quelques heures | 🔴 Important — réécriture partielle |
| **Risque** | Faible (peu de code change) | Moyen (refonte sécurité/permissions) |
| **Quand ?** | **Maintenant**, pour remettre l'app en ligne vite | Plus tard, si besoin de scalabilité |

➡️ **Plan conseillé : Variante A maintenant** (remet l'app en service rapidement et sans risque),
puis évaluer la Variante B seulement si le besoin se confirme.

---

## 5. Étapes concrètes de la Variante A (ce que je ferais, après ta validation)

1. **Créer le projet Supabase** (tu crées le compte, je te guide pas à pas — capture par capture si besoin).
2. Récupérer la `DATABASE_URL` Supabase et la mettre dans le `.env` backend (en local d'abord).
3. **Migrations propres** : remplacer le dangereux `db push --accept-data-loss` au démarrage par un
   `prisma migrate deploy` versionné (corrige le risque #1 de l'audit). Appliquer le schéma sur Supabase.
4. **Seed** des rôles + comptes de démo sur la nouvelle base.
5. **Stockage fichiers** : créer un bucket Supabase Storage, adapter la route `uploads.js` pour y écrire
   (au lieu du disque local), corriger les anciens chemins.
6. **Redéployer l'API** sur un hébergeur gratuit pérenne (Render ou Fly.io) avec les bonnes variables d'env
   + **régénérer le `JWT_SECRET`**.
7. **Pointer le frontend** : variable `VITE_API_URL` → nouvelle URL API, supprimer le fallback Railway en dur.
8. **Tester de bout en bout** : connexion, liste travailleurs, création visite, upload photo/signature.
9. Documenter la nouvelle architecture + les accès (doc de reprise).

> ⚠️ Aucune donnée n'est supprimée : si des données existent encore sur Railway et qu'on peut y accéder,
> on les exporte d'abord. Si Railway est totalement inaccessible, on repart du seed + ressaisie.
> **À confirmer avec toi : reste-t-il des données importantes à récupérer sur Railway ?**

---

## 6. Décisions attendues de ta part

1. ✅/❌ **Valides-tu Supabase** (Variante A) comme cible ?
2. As-tu encore **accès au compte Railway** / des données à exporter, ou peut-on repartir propre ?
3. Préfères-tu **Render** ou **Fly.io** pour héberger l'API Express (les deux ont un palier gratuit) ?
   *(Sinon je choisis Render, le plus simple.)*
