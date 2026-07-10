# Supabase Validation

Date : 2026-07-11

Projet attendu : `https://rgcgtcycbiuhcaoaadbh.supabase.co`

## Resultat de cette passe

| Verification | Resultat |
| --- | --- |
| Variables presentes dans shell Codex | Non |
| URL projet verifiee depuis env | Non |
| Requete reelle Supabase | Non executee |
| Supabase CLI disponible | Non |
| Migrations appliquees | Non |
| Tables verifiees | 0 |
| Functions RPC verifiees | 0 |
| Policies RLS verifiees | 0 |
| Triggers verifies | 0 |
| Buckets verifies | 0 |

## Objets verifies dans les migrations locales

| Objet | Total declare |
| --- | ---: |
| Migrations SQL | 9 |
| Tables publiques | 37 |
| Enums | 37 |
| Fonctions SQL/RPC | 19 |
| Triggers | 27 |
| Policies RLS | 107 |
| Index | 48 |
| Buckets Storage | 7 |

Les buckets declares localement sont `avatars`, `shipment-images`, `kyc-documents`, `flight-tickets`, `proof-of-delivery`, `dispute-evidence` et `hub-inspection-images`. Leur existence distante n'a pas ete confirmee.

## Variables attendues

Les variables doivent etre injectees par l'environnement securise et ne doivent jamais etre commitees :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## Remarque securite

Des cles Supabase ont ete collees dans la conversation utilisateur. Elles n'ont pas ete reprises dans un fichier du depot. Elles doivent etre remplacees cote Supabase avant tout test pilote.

## Commandes qui restent a executer quand l'environnement est pret

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Migrations attendues

Les migrations a appliquer sont dans `supabase/migrations/`. L'application automatique n'a pas ete tentee car ni `supabase` CLI ni URL Postgres securisee ne sont disponibles dans le shell.
