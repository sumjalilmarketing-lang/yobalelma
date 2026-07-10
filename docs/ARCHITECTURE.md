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
- `app/envoyer/page.tsx` publie une demande d'envoi.
- `app/livreur/page.tsx` cree ou met a jour le profil.
- `app/voyager/page.tsx` publie un trajet.
- `app/dashboard/page.tsx` affiche les donnees utilisateur.
- `app/dashboard/client/page.tsx`, `app/dashboard/transporter/page.tsx` et `app/dashboard/traveler/page.tsx` exposent les espaces par role.
- `app/dashboard/kyc/page.tsx` soumet les informations KYC.
- `app/auth/sign-in/page.tsx` propose connexion mot de passe et magic-link.
- `app/auth/sign-up/page.tsx`, `app/auth/forgot-password/page.tsx` et `app/auth/reset-password/page.tsx` couvrent le cycle compte public.
- `components/ui/` suit les conventions shadcn/ui.
- Tailwind CSS porte les couleurs de marque : noir, orange, blanc.

## Donnees et Supabase

Les clients Supabase sont isoles :

- `lib/supabase/browser.ts` pour le navigateur.
- `lib/supabase/server.ts` pour les Server Components, Route Handlers et Server Actions.

La validation d'environnement vit dans `lib/env.ts` et refuse toute URL Supabase autre que celle de Yobalelma.

Les routes API ecrivent dans Supabase :

- `POST /api/auth/sign-in`
- `POST /api/auth/sign-up`
- `POST /api/auth/password-sign-in`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/sign-out`
- `POST /api/kyc`
- `PUT /api/profile`
- `POST /api/parcel-requests`
- `POST /api/trips`

Les routes serveur et API lisent les cookies Supabase avec `@supabase/ssr`. Sans cle locale, les pages publiques restent executables et les surfaces donnees affichent un etat de configuration.

## Tests

Vitest valide les schemas et la configuration critique. Les tests UI pourront etre ajoutes quand les parcours produit seront implementes.
