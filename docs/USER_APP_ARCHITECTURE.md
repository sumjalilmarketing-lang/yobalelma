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

- Middleware dedie pour `/client`, `/transporter`, `/traveler`.
- Redirections legacy vers les nouvelles routes user-app.
- Pages serveur protegees par `requireRole`.
- RLS Supabase conservees comme barriere de donnees.

## Limite actuelle

Le multirole complet doit encore lire `user_roles` dans les guards, pas seulement `profiles.primary_role`.
