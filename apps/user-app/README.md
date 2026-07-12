# Yobalelma User App

Application utilisateur independante du monorepo Yobalelma.

## Roles

- client
- local_transporter
- traveler

## Commandes

```bash
npm run dev --workspace=user-app
npm run lint --workspace=user-app
npm run typecheck --workspace=user-app
npm run test --workspace=user-app
npm run build --workspace=user-app
npm run test:e2e --workspace=user-app
```

Cette app partage Supabase, les packages et les composants communs avec le reste du monorepo, mais expose ses routes physiques dans `apps/user-app/app`.
