# Rapport de performance traçabilité

Date de campagne : 24 juillet 2026.

## Résultats réellement mesurés

### Chaîne de hash locale

Campagne sûre et non persistante de 1 000 000 événements :

| Mesure | Résultat |
|---|---:|
| Durée | 5 559,03 ms |
| Débit | 179 887,55 événements/s |
| p50 | 0,0045 ms |
| p75 | 0,0051 ms |
| p95 | 0,0066 ms |
| p99 | 0,0166 ms |
| CPU processus utilisateur / système / total | 3 532 / 234 / 3 766 ms |
| Mémoire RSS / heap utilisée | 137,41 / 37,68 Mo |
| Taux d'erreur | 0 % |

Cette mesure couvre uniquement la génération et le chaînage SHA-256 en processus local. Elle ne couvre pas PostgreSQL, RLS, réseau, stockage, scans concurrents, GPS, offline ou workers.

### Projection Control Tower locale

Campagne sûre et non persistante de 1 000 000 événements :

| Mesure | Résultat |
|---|---:|
| Durée | 1 245,91 ms |
| Débit | 802 626 événements/s |
| CPU processus utilisateur / système / total | 860 / 15 / 875 ms |
| Mémoire RSS / heap utilisée | 203,20 / 108,18 Mo |
| Événements CI / critiques | 200 000 / 201 |
| Événements SN / critiques | 800 000 / 803 |
| Taux d'erreur | 0 % |

Cette campagne mesure la création, le tri et l'agrégation locale. Elle ne mesure pas la latence réelle de publication ou de consommation des événements.

## Charge PostgreSQL préproduction

Le harnais `scripts/traceability-postgres-preprod-load.mjs` :

- refuse explicitement le projet de production Yobalelma `rgcgtcycbiuhcaoaadbh` ;
- exige un contexte isolé et un colis synthétique ;
- utilise des transactions annulées afin de ne pas persister les données ;
- mesure débit, erreurs, p50, p75, p95 et p99.

Le contrôle `--check` a été exécuté et retourne `ready: false` : `TRACEABILITY_STAGING_PROJECT_REF` et `TRACEABILITY_STAGING_SHIPMENT_ID` sont absents. Les règles du dépôt interdisent tout autre projet Supabase et aucune branche/base isolée autorisée du projet Yobalelma n'est fournie. Aucune charge n'a été envoyée à la production.

## Métriques non mesurées

| Mesure demandée | Statut |
|---|---|
| CPU et mémoire PostgreSQL | non mesurées |
| Connexions PostgreSQL | non mesurées |
| Locks et deadlocks | non mesurés |
| Requêtes lentes | non mesurées |
| Latence RPC | non mesurée |
| Latence événements Control Tower | non mesurée |
| Créations/scans/transferts/GPS/offline/recherches/Passeports concurrents | non exécutés contre PostgreSQL |

## Seuils de la prochaine campagne

- arrêter immédiatement si le taux d'erreur dépasse 1 % ;
- arrêter si p95 dépasse 2 secondes durablement ;
- arrêter en cas de deadlock, saturation de connexions ou verrou prolongé ;
- utiliser uniquement des données synthétiques et un contexte explicitement autorisé ;
- conserver les métriques avant, pendant et après la campagne.

Les résultats locaux sont des contrôles algorithmiques, pas une preuve de capacité préproduction.
