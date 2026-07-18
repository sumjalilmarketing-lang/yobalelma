# Relay App

Application autonome des agents de points relais Yobalelma.

- Domaine : `relais.yobalelma.com`
- Routes : `/relay/*`
- Rôles : `relay_agent`, `relay_manager`, `operations_manager`
- Périmètre : réception, contrôle, stockage, inventaire, remise transporteur et remise destinataire par OTP
- Continuité : PWA hors ligne avec synchronisation idempotente
- International : français, anglais, espagnol, allemand, italien, portugais, arabe, russe et chinois

## Validation

```bash
npm run lint --workspace=@yobalelma/relay-app
npm run typecheck --workspace=@yobalelma/relay-app
npm run test --workspace=@yobalelma/relay-app
npm run build --workspace=@yobalelma/relay-app
npm run test:e2e --workspace=@yobalelma/relay-app
```

Voir `docs/RELAY_APP_PRODUCTION_READINESS.md` pour le rapport de livraison.
