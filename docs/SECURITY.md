# Security

## Secrets

Les cles Supabase et autres secrets doivent rester dans les variables d'environnement securisees.

Interdits :

- ecrire une cle dans le code ;
- ecrire une cle dans la documentation ;
- committer un fichier `.env` ;
- afficher une cle dans les logs.

## Supabase

L'URL projet autorisee est :

```text
https://rgcgtcycbiuhcaoaadbh.supabase.co
```

`lib/env.ts` valide cette URL pour eviter l'usage accidentel d'une base externe.

La connexion utilisateur utilise les liens magiques Supabase. Le callback d'authentification n'accepte que les redirections relatives internes afin d'eviter les redirections ouvertes.

## Client navigateur

Le navigateur ne doit utiliser que les variables publiques `NEXT_PUBLIC_*`.
Les cles privilegiees doivent rester cote serveur et ne sont pas configurees dans cette phase.

## Donnees

Quand les tables seront creees :

- activer Row Level Security ;
- definir les policies avant d'exposer une route ;
- verifier les donnees entrantes avec Zod ;
- limiter les informations personnelles collectees au strict necessaire.

Etat actuel :

- RLS activee dans la migration initiale.
- Routes API protegees par l'utilisateur Supabase courant.
- Aucune cle de service dans le code.
- `.env` et `.env*.local` ignores par Git.
