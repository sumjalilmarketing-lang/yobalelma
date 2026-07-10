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
| Supabase CLI disponible | Oui en temporaire : `v2.109.1` telechargee depuis GitHub Releases |
| `psql` disponible | Non |
| Token Management API fourni dans le chat | Recu mais non utilise en ligne de commande pour eviter l'exposition process/logs |
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
- `SUPABASE_ACCESS_TOKEN` optionnel : permet a `npm run validate:supabase` de recuperer les API keys via Management API si les cles projet ne sont pas injectees directement.

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

`npm run validate:supabase` execute `scripts/supabase-validate.mjs`. Cette commande verifie l'URL du projet, l'Auth Admin, les 37 tables REST et les 7 buckets Storage a partir des variables d'environnement, sans afficher les secrets. Elle accepte deux modes :

- mode direct : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` ;
- mode Management API : `SUPABASE_ACCESS_TOKEN`, qui recupere les cles projet en memoire sans les afficher.

## Migrations attendues

Les migrations a appliquer sont dans `supabase/migrations/`. Une configuration locale `supabase/config.toml` a ete initialisee sans secret. L'application automatique n'a pas ete executee car aucun `SUPABASE_ACCESS_TOKEN` n'est injecte dans l'environnement securise, et `supabase db push` exige ensuite un projet lie avec mot de passe Postgres ou un `--db-url`.

## Acces requis pour appliquer les migrations

D'apres la documentation officielle Supabase CLI, `supabase login` requiert un personal access token, et `supabase link` / `supabase db push` peuvent aussi requerir le mot de passe Postgres du projet. Ces valeurs ne sont pas presentes dans l'environnement local Codex.

Le token Management API ne doit pas etre passe en argument de commande. Il doit etre injecte par le gestionnaire d'environnement securise sous le nom `SUPABASE_ACCESS_TOKEN`.
