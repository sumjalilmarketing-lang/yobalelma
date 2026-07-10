# Supabase Validation

Date : 2026-07-11

Projet attendu : `https://rgcgtcycbiuhcaoaadbh.supabase.co`

## Resultat de cette passe

| Verification | Resultat |
| --- | --- |
| Variables presentes dans shell Codex | Non |
| URL projet verifiee depuis env | Non |
| Requete reelle Supabase | Oui, non authentifiee : `401 UNAUTHORIZED_MISSING_API_KEY` |
| Dashboard Supabase | Ouvert, mais redirige vers connexion GitHub/Supabase |
| Supabase CLI disponible | Non |
| `psql` disponible | Non |
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
npm run validate:supabase
npm run test:e2e
```

`npm run validate:supabase` execute `scripts/supabase-validate.mjs`. Cette commande verifie l'URL du projet, l'Auth Admin, les 37 tables REST et les 7 buckets Storage a partir des variables d'environnement, sans afficher les secrets.

## Migrations attendues

Les migrations a appliquer sont dans `supabase/migrations/`. L'application automatique n'a pas ete tentee car ni `supabase` CLI ni URL Postgres securisee ne sont disponibles dans le shell.

## Acces requis pour appliquer les migrations

D'apres la documentation officielle Supabase CLI, `supabase login` requiert un personal access token, et `supabase link` / `supabase db push` peuvent aussi requérir le mot de passe Postgres du projet. Ces valeurs ne sont pas presentes dans l'environnement local Codex.
