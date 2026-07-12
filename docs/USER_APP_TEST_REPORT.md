# User App Test Report

Ce document doit etre mis a jour apres chaque validation.

## Commandes cible

- `npm install`
- `npm run lint --workspace=user-app`
- `npm run typecheck --workspace=user-app`
- `npm run test --workspace=user-app`
- `npm run build --workspace=user-app`
- `npm run test:e2e --workspace=user-app`

## Couverture ajoutee

- Presence physique des routes user-app.
- Acces user-app limite aux roles externes.
- Detection national/international.
- Smoke E2E routes publiques et protection des routes privees.

## Resultats

- `npm install`: reussi, lockfile workspace mis a jour.
- `npm run lint --workspace=user-app`: reussi.
- `npm run typecheck --workspace=user-app`: reussi.
- `npm run test --workspace=user-app`: reussi, 2 fichiers, 3 tests.
- `npm run build --workspace=user-app`: reussi, 54 routes generees.
- `npm run test:e2e --workspace=user-app`: reussi, 16 tests Playwright.
- `npm run validate:supabase`: reussi hors sandbox, Auth OK, 10 buckets OK, 69 tables OK.
- `npm run audit:supabase-security`: reussi hors sandbox, RLS/policies attendues OK.
- `npm run lint`: reussi.
- `npm run typecheck`: reussi.
- `npm run test`: reussi, 15 fichiers, 77 tests.
- `npm run build`: reussi.
- `npm run test:e2e`: reussi, 38 tests Playwright.

## Notes

Vitest et Supabase ont necessite une execution hors sandbox a cause de restrictions Windows/esbuild et reseau HTTPS. Aucun secret n'a ete affiche.
