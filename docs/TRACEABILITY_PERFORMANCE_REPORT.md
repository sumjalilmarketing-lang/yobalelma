# Rapport de performance traçabilité

Date : 24 juillet 2026.

## Mesures réellement exécutées

### Chaîne de hash locale — 1 000 000 événements

| Mesure | Résultat |
|---|---:|
| Durée | 5 559,03 ms |
| Débit | 179 887,55 événements/s |
| p50 / p75 / p95 / p99 | 0,0045 / 0,0051 / 0,0066 / 0,0166 ms |
| CPU utilisateur / système / total | 3 532 / 234 / 3 766 ms |
| Mémoire RSS / heap | 137,41 / 37,68 Mo |
| Taux d'erreur | 0 % |

### Projection Control Tower locale — 1 000 000 événements

| Mesure | Résultat |
|---|---:|
| Durée | 1 245,91 ms |
| Débit | 802 626 événements/s |
| CPU utilisateur / système / total | 860 / 15 / 875 ms |
| Mémoire RSS / heap | 203,20 / 108,18 Mo |
| Taux d'erreur | 0 % |

Ces résultats sont algorithmiques et non persistants. Ils ne représentent pas PostgreSQL ou le réseau.

## Harnais préproduction préparés

### Écritures concurrentes

`scripts/traceability-postgres-preprod-load.mjs` exécute des appels concurrents annulés par transaction et mesure p50, p75, p95, p99, débit et erreurs.

### Profil et EXPLAIN

`scripts/traceability-postgres-preprod-profile.mjs` mesure :

- lecture du Passeport et des preuves ;
- recherche par colis/tracking ;
- lecture de possession ;
- p50, p75, p95, p99, débit, erreurs et taille moyenne des résultats ;
- connexions, locks en attente et deadlocks ;
- requêtes lentes via `pg_stat_statements` lorsqu'il est disponible ;
- `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` des requêtes critiques.

Le scénario complet demande en plus de mesurer les RPC de demande/décision, la synchronisation offline et la génération PDF depuis les applications.

## État d'exécution

Les trois contrôles de préparation (`field-audit`, `postgres-profile`, `postgres-load`) retournent `ready: false`. Les paramètres de préproduction et les colis synthétiques sont absents. Le projet de production `rgcgtcycbiuhcaoaadbh` est explicitement refusé par les harnais.

Par conséquent, aucune mesure réelle n'est revendiquée pour :

- RPC, écritures, recherches ou possessions PostgreSQL ;
- synchronisations offline concurrentes ;
- génération PDF applicative ;
- connexions, locks, deadlocks et requêtes lentes en charge ;
- CPU/mémoire du serveur PostgreSQL ;
- latence Control Tower réelle.

## Seuils d'arrêt

- erreur > 1 % ;
- p95 > 2 secondes durablement ;
- deadlock ou verrou prolongé ;
- saturation de connexions ;
- hausse anormale CPU/mémoire ;
- toute écriture non synthétique ou non annulée.

Aucune charge dangereuse n'a été envoyée à la production.
