# PHASE 2 — Rendre MedWork universel — PLAN (à valider)

> Objectif : retirer toute identité « CBG » codée en dur et permettre à n'importe quel
> service de santé au travail d'utiliser MedWork avec sa propre identité et ses propres
> entreprises/sites. **Aucune exécution avant validation.**

---

## Distinction importante à trancher : quel niveau de « multi-entreprise » ?

| Niveau | Description | Recommandation |
|--------|-------------|----------------|
| **A. Instance personnalisable** (mono-locataire) | Une installation de MedWork = un service de santé. Il a SA marque (nom, logo) et gère SA liste d'entreprises/sites clients. Pour servir un autre client, on déploie une autre instance. | ✅ **Recommandé maintenant** — couvre 100% du besoin exprimé, faible risque |
| **B. Vrai SaaS multi-locataires** | Une seule installation héberge plusieurs services de santé **cloisonnés** (chacun ne voit que ses données). | ⏳ Plus tard si tu veux héberger plusieurs clients distincts sur une même base. Gros chantier (isolation de toutes les requêtes). Hors périmètre Phase 2. |

➡️ Ce plan vise le **niveau A**. On garde la porte ouverte au B pour plus tard.

---

## Bloc 1 — Dé-branding (rapide, visible, faible risque)

Remplacer toutes les mentions « CBG / MédWork CBG » par l'identité configurable (Bloc 2) ou,
à défaut, par « MedWork » neutre :

1. `frontend/index.html` : titre `frontend` → **MedWork**.
2. `Navigation.tsx` (barre latérale) : « MédWork CBG » → nom de l'organisation.
3. `LoginPage.tsx` : logo `/cbg-logo.jpg` + « MédWork CBG » → logo + nom de l'organisation.
4. `WorkerDetailsPage.tsx` : en-têtes des documents imprimés « …— CBG » → nom de l'organisation.
5. `WorkerFormPage.tsx` : entreprise par défaut « CBG » → choisie dans la liste (Bloc 3).
6. Emails de démo `@cbg.com` et exemples « CBG-001 » → neutres (`@exemple.com`, `MAT-001`).
7. Favicon / logo : prévoir un logo MedWork neutre par défaut.

## Bloc 2 — Identité de l'organisation (configurable)

Permettre à l'admin de définir l'identité de SON service de santé :

- **Backend** : table `OrganizationSettings` (1 seule ligne) — `name`, `logo` (image base64),
  `primaryColor` (optionnel), `address`/`pays` (pour les documents imprimés).
- **Route API** : `GET /api/settings/organization` (lisible par tous, pour afficher la marque) +
  `PUT /api/settings/organization` (super admin uniquement).
- **Frontend** : nouvelle page **Paramètres → Organisation** (nom + upload logo + couleur).
- **Câblage** : le nom et le logo s'affichent automatiquement sur la connexion, la barre latérale,
  et les en-têtes des documents imprimés. Le titre de l'onglet du navigateur suit le nom.

## Bloc 3 — Entreprises / sites gérés (liste structurée)

Transformer le champ « entreprise » texte libre en **liste gérée** :

- **Backend** : table `Company` — `name`, `code`/secteur (optionnel), `active`.
  Route `/api/companies` (CRUD, protégé par une nouvelle permission `settings.companies`).
- **Frontend** : page **Paramètres → Entreprises** (créer / modifier / désactiver).
- **Formulaire travailleur** : le champ « Entreprise » devient un **menu déroulant** alimenté par
  cette liste (au lieu d'une saisie libre). On conserve `Worker.company` (texte = nom choisi) pour
  ne pas casser l'existant — option de formaliser un lien fort (clé étrangère) plus tard.
- **Bénéfice** : filtrage des travailleurs par entreprise + statistiques « par entreprise/site »
  (demandées dans le cahier des charges).

## Bloc 4 — Migration & données

- Nouvelle migration Prisma **additive** (tables `OrganizationSettings` + `Company`) → sans risque
  pour les données existantes. Appliquée automatiquement au déploiement Render.
- Initialisation : une organisation par défaut « MedWork » + une entreprise « CBG » (pour que le
  travailleur de démo existant reste cohérent). L'admin pourra tout renommer depuis l'interface.

---

## Ordre d'exécution proposé (livraison incrémentale)

1. **Bloc 1 (dé-branding)** → déployable tout de suite, effet visible immédiat.
2. **Bloc 2 (organisation)** → la marque devient configurable.
3. **Bloc 3 (entreprises)** → liste gérée + dropdown + base des stats.

À chaque bloc : build, déploiement, vérification ensemble.

---

## Décisions attendues de ta part
1. On vise bien le **niveau A** (instance personnalisable), pas le SaaS multi-locataires maintenant ?
2. OK pour l'**identité d'organisation configurable** (nom + logo + couleur) ?
3. OK pour transformer **« Entreprise » en liste gérée** (menu déroulant) ?
4. Préférence sur le point de départ : je commence par le **Bloc 1 (dé-branding visible)** ?
