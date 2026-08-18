# SafiBudget — Backend Next.js + Prisma + Neon

Ce dossier contient le **backend** (base de données réelle) pour SafiBudget,
en remplacement de la couche `SafiDB` (localStorage) de la version HTML.

## Ce qui est prêt

- **`prisma/schema.prisma`** — schéma complet : utilisateurs, transactions,
  budget, objectifs, échéances, notifications, comptes liés, tontines
  (participants / paiements / cycles), communauté, défis, badges, académie.
- **Authentification** (NextAuth + credentials + bcrypt) :
  - `POST /api/auth/register` — création de compte
  - NextAuth gère la connexion (`/api/auth/[...nextauth]`)
- **`GET /api/state`** — reconstruit l'état complet de l'utilisateur connecté
  (même forme que `SafiDB.load()` actuel), pour un branchement rapide au front existant.
- **`PUT /api/state`** — sauvegarde granulaire (transactions, objectifs, budget
  pour l'instant — à étendre aux autres collections, voir le commentaire dans le fichier).
- **`POST /api/tontines/:id/contribute`** — portage de `SafiDB.contribute()`,
  mais en transaction Postgres pour éviter les doubles paiements si plusieurs
  membres cotisent en même temps (chose impossible à garantir avec localStorage).

## Ce qu'il reste à faire

1. **Étendre `PUT /api/state`** aux collections restantes (imprévus, échéances,
   notifications, comptes liés, défis, communauté) — même schéma create/update/delete
   que pour `transaction` et `objective`.
2. **Porter `submit-proof`, `validate-proof`, `disburse`** (logique tontine externe)
   sur le même modèle que `contribute/route.js`.
3. **Remplacer les 5 appels IA** (`fetch('https://api.anthropic.com/...')`) par un
   nouvel endpoint `/api/ia/*` qui utilise `ANTHROPIC_API_KEY` côté serveur.
4. **Brancher le front** : dans `index.html`, remplacer les méthodes de `SafiDB`
   (`load`, `save`) par des `fetch('/api/state')` — c'est exactement ce que le
   commentaire d'origine dans le code annonçait.
5. Décider si le HTML reste servi tel quel (dans `public/` ou une route catch-all)
   ou si on le fait migrer progressivement en composants React — pas obligatoire
   pour que la base de données fonctionne.

## Mise en route

```bash
npm install
cp .env.example .env      # puis remplis DATABASE_URL / DIRECT_URL avec tes identifiants Neon
npx prisma migrate dev --name init
npm run dev
```

## Créer la base Neon

1. Va sur https://neon.tech, crée un projet (région proche du Maroc : `eu-central-1` par ex.)
2. Dans "Connection Details", copie les 2 chaînes de connexion (pooled + direct)
   dans `DATABASE_URL` et `DIRECT_URL`.
3. Une fois le projet poussé sur Vercel, ajoute ces mêmes variables dans
   Vercel → Project Settings → Environment Variables (comme pour `boutique-ecommerce`).
