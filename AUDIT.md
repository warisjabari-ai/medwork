# MEDWORK — Audit complet (Phase 1)

> Rapport produit le 2026-06-20 avant toute modification.
> Aucune suppression majeure ne sera effectuée sans validation préalable.

---

## 1. Vue d'ensemble

**MedWork** est une plateforme web de gestion de la santé au travail, développée à l'origine pour la
**Compagnie des Bauxites de Guinée (CBG)**. L'application est fonctionnelle et relativement mature
(~9 400 lignes de frontend, backend structuré), mais elle est aujourd'hui **mono-entreprise** (CBG en dur
à plusieurs endroits) et son backend est **hors-service car hébergé sur Railway dont le plan gratuit a expiré**.

### Architecture technique actuelle

| Couche | Technologie | Hébergement |
|--------|-------------|-------------|
| Frontend | React 19 + TypeScript + Vite 8 + Tailwind 3 | **Vercel** |
| Backend | Node.js + Express 4 + Prisma 5 | **Railway** (expiré ❌) |
| Base de données | PostgreSQL 16 | **Railway** (expiré ❌) |
| Auth | JWT (jsonwebtoken) + bcrypt | — |
| Fichiers (photos, signatures) | Stockage disque local (`/uploads`) via multer | Railway (volatil ❌) |
| Dév local | docker-compose (Postgres + backend) | Local |

**Constat clé :** tant que le backend Railway est down, **l'application entière est inutilisable**
(le frontend Vercel ne fait qu'afficher l'écran de connexion sans pouvoir s'authentifier).
→ La **Phase 4 (sortie de Railway)** est donc le préalable bloquant à tout le reste.

---

## 2. Cartographie des modules

### Backend — 11 routes API (`backend/src/routes/`)

| Route | Rôle | État |
|-------|------|------|
| `auth.js` | Login, /me, changement de mot de passe | ✅ Complet |
| `users.js` | CRUD utilisateurs internes (personnel médical) | ✅ Complet |
| `roles.js` | CRUD rôles + permissions | ✅ Complet |
| `workers.js` | CRUD travailleurs, statut contractuel | ✅ Complet |
| `medicalHistory.js` | Antécédents, vaccinations, expositions | ✅ Complet |
| `visits.js` | CRUD visites + sous-tables (le plus gros, 275 l.) | ✅ Complet |
| `visitTypes.js` | Types de visite configurables | ✅ Complet |
| `examTypes.js` | Catalogue d'examens biologiques + valeurs de réf. | ✅ Complet |
| `decisions.js` | Décisions d'aptitude | ✅ Complet |
| `reports.js` | Données pour rapports/stats | ⚠️ Basique |
| `uploads.js` | Upload photos/signatures | ⚠️ Stockage local volatil |

### Frontend — 13 pages (`frontend/src/pages/`)

| Page | Lignes | Fonction |
|------|-------:|----------|
| `WorkerDetailsPage` | 2168 | Dossier travailleur complet + saisie de visite (cœur de l'app) |
| `VisitTypesPage` | 1070 | Configuration des types de visite et de leurs sections |
| `ReportsPage` | 1040 | Rapports imprimables (print → PDF navigateur) |
| `UserManagementPage` | 477 | Gestion du personnel médical |
| `VisitsPage` | 450 | Liste des visites |
| `ExamTypesPage` | 419 | Catalogue d'examens |
| `WorkersPage` | 382 | Liste des travailleurs |
| `RolesPage` | 367 | Gestion des rôles/permissions |
| `DecisionsPage` | 316 | Décisions d'aptitude |
| `DashboardPage` | 297 | Tableau de bord / KPIs |
| `ProfilePage` | 265 | Profil utilisateur |
| `WorkerFormPage` | 191 | Création/édition travailleur |
| `LoginPage` | 146 | Connexion |

**Note d'architecture :** `react-router-dom` est installé mais **non utilisé** — la navigation est gérée
manuellement par un état `page` dans `App.tsx` (754 l.) avec persistance via `sessionStorage`.

---

## 3. Logique métier existante (modèle de données Prisma)

L'application couvre **déjà une bonne partie** du périmètre métier demandé :

| Besoin métier (cahier des charges) | Couvert ? | Détail |
|-----------------------------------|:---------:|--------|
| **Dossiers travailleurs** | ✅ | Modèle `Worker` |
| Historique médical | ✅ | `WorkerAntecedent`, `Diagnosis(isHistory)` |
| Affectation entreprise / département / poste | ⚠️ | Champs **texte libre** sur `Worker`, pas d'entités structurées |
| **Visites** (embauche, périodique, reprise, demande, mutation, fin de carrière) | ✅ | `VisitType` configurable — tous types possibles |
| **Examens cliniques** | ✅ | `ClinicalExam` (poids, taille, IMC, TA, pouls…) |
| Examen physique par appareil | ✅ | `PhysicalExam` (ORL, cardio, neuro…) |
| **Examens biologiques** | ✅ | `ExamType` + `ExamResult` avec valeurs de référence (sexe/âge) |
| Examens complémentaires / fonctionnels | ✅ | `FunctionalEval` (ECG, spiro, audio, vision…) |
| Historisation des résultats | ✅ | Résultats liés à chaque visite |
| **Aptitudes** (apte / restrictions / inapte temp. / inapte déf.) | ✅ | Modèle `Decision` configurable |
| **Risques professionnels** | ⚠️ | `WorkerExposition` existe mais **pas de catalogue structuré** des 5 familles (physique, chimique, biologique, ergonomique, psychosocial) |
| Plaintes / diagnostics / traitements | ✅ | `Complaint`, `Diagnosis`, `Treatment` |
| Vaccinations | ✅ | `WorkerVaccination` |
| **Statistiques / KPIs SST** | ⚠️ | Dashboard + Reports existants mais **basiques** |

### Modèle de permissions (bien conçu)
Système de permissions hiérarchiques (`visits.edit` → `visits.edit.biology`) avec rôles configurables.
Rôles existants (seed) : Super Admin, Médecin du travail, Médecin généraliste, Infirmier, Secrétaire, Laborantin.
→ **Aucun rôle RH** (à créer en Phase 5).

---

## 4. Ce qui MANQUE par rapport au cahier des charges

| Demande | État actuel |
|---------|-------------|
| **Pivot multi-entreprises** (solution universelle) | ❌ Mono-tenant, "CBG" en dur |
| **Rôle RH** + cloisonnement du secret médical | ❌ Inexistant |
| **Module arrêts maladie** (émission médecin / suivi RH) | ❌ Inexistant |
| **Notifications** (email / in-app / SMS / WhatsApp) | ❌ Inexistant |
| **Gestion administrative du personnel** (activation, départ, démission, retraite, licenciement, transfert) | ⚠️ Partiel (`contractStatus` à 3 valeurs seulement) |
| **Génération PDF réelle** | ❌ Seulement `window.print()` du navigateur |
| **Signature électronique** | ⚠️ Upload d'image de signature uniquement |
| Convocations automatiques, EPI, accidents du travail, maladies pro, portail employé, app mobile | ❌ Inexistants |
| **Catalogue structuré des risques professionnels** | ❌ |

---

## 5. Bugs, risques et dette technique identifiés

### 🔴 Critiques
1. **Backend Railway expiré** → application inutilisable. (Phase 4 = priorité absolue.)
2. **`prisma db push --accept-data-loss` exécuté à CHAQUE démarrage** du serveur (`src/index.js`).
   → Risque de **perte de données** en production. Les migrations versionnées existent mais sont **contournées**.
3. ~~**Stockage des fichiers sur disque local**~~ → **CORRIGÉ après vérification** : les photos et signatures
   sont en réalité stockées en **base64 directement dans la base** (colonnes `photo`/`signature`), pas sur
   disque. Pas de perte au redéploiement. Le dossier `/uploads` et la dépendance `multer` sont du **code
   mort inutilisé** (à nettoyer plus tard). *Limite réelle, mineure :* le base64 alourdit la base ;
   un passage à Supabase Storage est souhaitable à terme mais **non bloquant**.
4. **Secrets par défaut dans le code** : `JWT_SECRET: "medwork-cbg-secret-changez-moi"` dans
   `docker-compose.yml`. Le `.env` backend contient des secrets réels (à faire tourner lors de la migration).

### 🟠 Importants
5. **CORS en dur** sur des URLs Vercel/Railway spécifiques (`src/index.js`) → casse à chaque changement de domaine.
6. **URL backend en dur** dans `frontend/src/api.ts` (fallback Railway) → à externaliser proprement en variable d'env.
7. **Dates stockées en texte** (`String` "JJ/MM/AAAA") au lieu de `DateTime` → tri, filtres et calculs
   de périodicité fragiles, risque d'erreurs de format.
8. **Pas de tests** (aucun fichier de test, ni frontend ni backend).
9. **Pas de pagination** sur les listes (travailleurs, visites) → lenteurs à fort volume.
10. **`react-router-dom` installé mais inutilisé** → confusion + poids inutile.

### 🟡 Mineurs / cosmétiques
11. Branding "CBG / MédWork CBG" résiduel à 13 endroits dans le frontend + libellés API.
12. Versions très récentes/non-LTS (Vite 8, React 19, Tailwind incohérent : v4 à la racine, v3 dans le frontend).
13. Données de seed spécifiques CBG (comptes `icamara`, `CBG-001`…).

---

## 6. UX/UI — état actuel

- Interface fonctionnelle en **Tailwind 3**, palette **bleu/cyan** (slate + cyan).
- Navigation par sidebar + header (`Navigation.tsx`, 660 l.).
- Pas de bibliothèque de composants (tout en Tailwind manuel) → incohérences possibles, maintenance lourde.
- **Références de design disponibles dans le repo** :
  - `design/` : design system **shadcn/ui complet** (Lovable), thème sombre premium, ~60 composants
    (cards, charts, KPI rows, AI copilot panel, dashboard hero…). Excellente base pour la refonte SaaS.
  - `ZDesign/` : thème Next.js + shadcn, variantes claires/sombres.

---

## 7. Recommandation de séquencement (proposée)

Le cahier des charges décrit ~6 mois de travail. Ordre logique recommandé :

1. **Phase 4 — Sortie de Railway → Supabase** *(débloquant, à faire en premier)*.
   Supabase = Postgres managé + Auth + Storage + API, plan gratuit pérenne. Migration du schéma Prisma
   directe, et résout d'un coup les problèmes #1, #3 et #4.
2. **Dé-branding CBG → MedWork universel** + introduction d'une entité `Company` (multi-tenant léger).
3. **Phase 5 — Module RH** (rôle RH cloisonné, arrêts maladie, notifications email, gestion administrative).
4. **Phase 3 — Refonte UX/UI** en s'appuyant sur `design/` (shadcn).
5. **Phase 6 — Nouvelles fonctionnalités** (PDF réel, convocations, risques structurés, AT/MP, EPI…).
6. **Fiabilisation** : migrations propres, dates typées, tests, pagination.

---

## 8. Livrables de cet audit

- ✅ Audit fonctionnel, technique et UX/UI (ce document).
- ✅ Liste des bugs et risques (§5).
- ⏳ À valider avec le commanditaire : ordre des priorités et choix d'hébergement (Phase 4).
