# Collection App

Application autonome des transporteurs internes Yobalelma.

- Domaine cible : `collecte.yobalelma.com`
- Routes : `/collection/*`
- Rôles : `collection_driver`, `collection_manager`, `operations_manager`
- Périmètre : relais → hub, hub → hub, hub → aéroport/port/centre de distribution
- Hors périmètre : collecte client et livraison finale

## Validation

```bash
npm run lint --workspace=@yobalelma/collection-app
npm run typecheck --workspace=@yobalelma/collection-app
npm run test --workspace=@yobalelma/collection-app
npm run build --workspace=@yobalelma/collection-app
npm run test:e2e --workspace=@yobalelma/collection-app
```

Le rapport de sécurité et de préparation est dans `docs/COLLECTION_APP_PRODUCTION_READINESS.md`.
