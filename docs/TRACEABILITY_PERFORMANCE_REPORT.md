# Rapport de performance traçabilité

## Mesures disponibles

Le micro-benchmark local précédent a produit 100 000 maillons SHA-256 en 456,57 ms, soit 219 024 événements/s, p50 0,0026 ms, p75 0,0032 ms, p95 0,0069 ms et p99 0,0222 ms. Cette mesure ne couvre ni PostgreSQL, ni RLS, ni réseau, ni stockage, ni concurrence et ne vaut pas preuve de capacité.

Les écritures de passeport sont O(1) sous verrou de ligne par colis. Les lectures sont indexées par colis/séquence, expédition/date, pays/date, détenteur/date et anomalie active. Les timelines Admin sont bornées à 250 événements et 100 preuves.

## Harnais PostgreSQL préproduction

`scripts/traceability-postgres-preprod-load.mjs` :

- refuse explicitement le projet de production `rgcgtcycbiuhcaoaadbh` ;
- exige un projet staging et un colis synthétique dédiés ;
- lance des écritures concurrentes réelles sur PostgreSQL dans des transactions annulées ;
- mesure débit, erreurs, p50, p95 et p99 ;
- ne persiste aucune donnée de charge.

Le contrôle `--check` a été exécuté. Résultat : non prêt, car `TRACEABILITY_STAGING_PROJECT_REF` et `TRACEABILITY_STAGING_SHIPMENT_ID` sont absents. Aucun test PostgreSQL préproduction n’a donc été exécuté et aucune performance avant/après n’est revendiquée.

Commande autorisée uniquement après configuration d’un staging isolé :

```powershell
node scripts/traceability-postgres-preprod-load.mjs
```

Arrêter la campagne si le taux d’erreur dépasse 1 %, si p95 dépasse 2 secondes ou si les métriques DB montrent saturation/verrous prolongés.
