# Relay App

Application autonome des agents de points relais Yobalelma.

- URL de production : `https://yobalelma-relay.vercel.app`
- Routes : `/relay/*`
- Rôles : `relay_agent`, `relay_manager`, `operations_manager`
- Périmètre : réception, contrôle, stockage, inventaire, remise transporteur et remise destinataire par OTP
- Continuité : interface terrain disponible en cas de coupure et opérations protégées contre les doublons
- Interface : français, formats régionaux Yobalelma et responsive ordinateur/tablette/mobile

## Validation

```bash
npm run lint --workspace=@yobalelma/relay-app
npm run typecheck --workspace=@yobalelma/relay-app
npm run test --workspace=@yobalelma/relay-app
npm run build --workspace=@yobalelma/relay-app
npm run test:e2e --workspace=@yobalelma/relay-app
```

Voir `docs/RELAY_APP_PRODUCTION_READINESS.md` pour le rapport de livraison.
