# AGENTS.md

## Mission

Développer la plateforme Yobalelma dans ce dépôt indépendant.

## Frontières obligatoires

- Ne jamais toucher à AfriCRM Shop.
- Ne jamais importer de code, modèle de données, workflow métier ou dépendance propre à AfriCRM Shop.
- Ne jamais utiliser une base Supabase autre que le projet Yobalelma :
  `https://rgcgtcycbiuhcaoaadbh.supabase.co`.
- Ne jamais committer de secret.

## Commandes de validation

Avant de considérer une phase comme terminée :

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Standards

- TypeScript strict.
- App Router Next.js.
- Validation de données avec Zod.
- Formulaires avec React Hook Form.
- Clients Supabase séparés navigateur/serveur.
- Documentation à jour dans `docs/`.

