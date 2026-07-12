# User App Security

## Protections

- `.env.local` reste ignore par Git.
- Les secrets ne sont pas ecrits dans le code.
- Middleware user-app protege les espaces externes.
- Les anciennes routes dashboard user sont redirigees vers les routes user-app.
- Les pages serveur appellent `requireRole`.
- Les donnees privees restent protegees par les RLS Supabase.

## Donnees publiques interdites dans le tracking

- Adresse complete.
- Telephone.
- Documents KYC.
- Billet.
- Donnees financieres.
- Nom complet du voyageur.

## Risques restants

- Guards multiroles a etendre depuis `user_roles`.
- Policies RLS distantes a revalider apres chaque nouvelle migration.
- Providers externes paiement/notification non branches.
