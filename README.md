# Yobalelma

Yobalelma est une plateforme indépendante dédiée à la livraison collaborative entre voyageurs et expéditeurs.

Slogan : **Chaque voyage devient une livraison**.

## Fondation technique

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Supabase
- Vitest
- GitHub Actions

## Supabase

Le projet Supabase Yobalelma utilise exclusivement cette URL :

```text
https://rgcgtcycbiuhcaoaadbh.supabase.co
```

Les clés Supabase doivent rester dans les variables d'environnement sécurisées. Elles ne doivent jamais être écrites dans le code, les fichiers de documentation ou les commits.

## Scripts

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

## Variables d'environnement

Copier `.env.example` vers `.env.local`, puis renseigner les valeurs sécurisées.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rgcgtcycbiuhcaoaadbh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Règles de dépôt

- Ce dépôt est exclusivement réservé à Yobalelma.
- Aucun code, composant métier, schéma ou dépendance spécifique à AfriCRM Shop ne doit y être ajouté.
- Aucun secret ne doit être committé.

