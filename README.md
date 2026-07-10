# Yobalelma

Yobalelma est une plateforme independante dediee a la livraison collaborative entre voyageurs et expediteurs.

Slogan : **Chaque voyage devient une livraison**.

## Fondation technique

- Node.js 22+
- Next.js App Router
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Supabase
- Vitest
- GitHub Actions

## Produit inclus

- Landing page Yobalelma.
- Connexion Supabase par lien magique et mot de passe.
- Creation de profils et roles operationnels.
- Expeditions nationales/internationales.
- Livreurs locaux, Tiak-Tiak, relais, collecte, hub et voyageurs.
- QR handover et tracking operationnel.
- Migrations Supabase avec RLS.

## Supabase

Le projet Supabase Yobalelma utilise exclusivement cette URL :

```text
https://rgcgtcycbiuhcaoaadbh.supabase.co
```

Les cles Supabase doivent rester dans les variables d'environnement securisees. Elles ne doivent jamais etre ecrites dans le code, les fichiers de documentation ou les commits.

## Scripts

```bash
npm install
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run validate:supabase
npm run test:e2e
```

## Variables d'environnement

Copier `.env.example` vers `.env.local`, puis renseigner les valeurs sécurisées.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rgcgtcycbiuhcaoaadbh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ACCESS_TOKEN=
NEXT_PUBLIC_APP_URL=http://127.0.0.1:43117
```

## Regles de depot

- Ce depot est exclusivement reserve a Yobalelma.
- Aucun code, composant metier, schema ou dependance specifique a AfriCRM Shop ne doit y etre ajoute.
- Aucun secret ne doit etre committe.
