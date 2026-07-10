# Architecture

## Vue d'ensemble

Yobalelma est une application Next.js App Router en TypeScript strict.

```text
app/                  Routes App Router
components/           UI, marque et composants fonctionnels
lib/                  Configuration, validation, clients externes
types/                Types partages
supabase/migrations/  Migrations SQL du projet Yobalelma
tests/                Tests Vitest
docs/                 Documentation produit et technique
```

## Frontend

- `app/layout.tsx` fournit le shell global et les metadata.
- `app/page.tsx` contient la landing page de phase 1.
- `components/ui/` suit les conventions shadcn/ui.
- Tailwind CSS porte les couleurs de marque : noir, orange, blanc.

## Donnees et Supabase

Les clients Supabase sont isoles :

- `lib/supabase/browser.ts` pour le navigateur.
- `lib/supabase/server.ts` pour les Server Components, Route Handlers et Server Actions.

La validation d'environnement vit dans `lib/env.ts` et refuse toute URL Supabase autre que celle de Yobalelma.

## Tests

Vitest valide les schemas et la configuration critique. Les tests UI pourront etre ajoutes quand les parcours produit seront implementes.

