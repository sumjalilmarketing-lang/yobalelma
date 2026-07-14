# User App Architecture

`apps/user-app` est une application Next.js App Router independante dans le monorepo npm workspaces.

## Principes

- Backend Supabase unique: `https://rgcgtcycbiuhcaoaadbh.supabase.co`.
- Routes physiques locales dans `apps/user-app/app`.
- Code metier partage par `lib/` et `packages/`.
- Assets de marque copies localement dans `apps/user-app/public/brand`.
- Compatibilite temporaire avec le host legacy par wrappers et redirections.

## Roles

- `client`
- `local_transporter`
- `traveler`

## Securite

- Middleware dedie aux redirections legacy user-app.
- Redirections legacy vers les nouvelles routes user-app.
- Pages serveur protegees par `requireRole`.
- `requireRole` lit `profiles`, `role_assignments` et `user_roles`.
- Les comptes suspendus ou fermes sont bloques avant rendu des donnees privees.
- RLS Supabase conservees comme barriere de donnees.

## Multirole

Le selecteur d'espace user-app affiche uniquement les roles externes reellement attribues:

- Espace client
- Espace livreur
- Espace voyageur
