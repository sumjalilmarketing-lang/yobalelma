# CTO Hardening Log

Date : 2026-07-11

## Objectif

Renforcer Yobalelma comme produit SaaS exploitable a grande echelle, sans toucher aux donnees distantes et sans exposer de secrets.

## Decisions appliquees

### Headers de securite globaux

Les headers de securite sont centralises dans `lib/security/headers.ts` et appliques par `next.config.ts` sur toutes les routes.

Protections ajoutees :

- Content Security Policy adaptee au projet Supabase Yobalelma.
- Protection anti-clickjacking via `X-Frame-Options` et `frame-ancestors`.
- `nosniff`, referrer strict, permissions navigateur bloquees par defaut.
- HSTS pour les environnements HTTPS.

### Parsing JSON API standardise

Les route handlers qui lisaient directement `request.json()` utilisent maintenant `parseJsonRequest` ou `readJsonRequest`.

Impact :

- JSON invalide : reponse controlee `400`.
- Payload invalide : reponse controlee `422`.
- Moins de risques de `500` non maitrises sur les endpoints publics.

### Redirections Auth durcies

`getSafeAuthRedirect` rejette maintenant :

- URLs externes.
- URLs protocol-relative.
- Backslashes.
- caracteres de controle.
- payloads anormalement longs.

## Etat Supabase

La validation distante reste bloquee tant que les secrets ne sont pas visibles dans l'environnement local :

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `DATABASE_URL`

Les migrations locales declarent 41 tables, 117 policies RLS et 7 buckets Storage, mais leur application distante n'a pas pu etre prouvee dans cette phase.

## Verification

Cette phase doit rester valide avec :

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```
