# Audit performance et latence

## Périmètre et méthode

Builds Next.js, tailles de chargement, replay Control Tower et inspection des stratégies de requêtes/pagination. Aucun test de production n’a été lancé.

## Mesures

| Mesure | Avant documenté | Après |
|---|---:|---:|
| Replay 250 000 événements | 581,61 ms | 301 ms |
| Débit replay | 429 841/s | 830 565/s |
| Mémoire additionnelle | 32 Mo | 32 Mo |
| Admin `/command` | non mesuré | 43,5 kB ; 159 kB First Load JS |
| Socle partagé | non mesuré | 102 kB First Load JS |

La carte regroupe les marqueurs avant rendu, limite les listes serveur, filtre côté client sur un ensemble borné et n’affiche aucune coordonnée manquante. Les données fournissent un état de fraîcheur au lieu de masquer la latence.

## Risques résiduels

Les p50/p75/p95/p99 réseau, API, Postgres, GPS, dispatch et worker ne sont pas démontrés sur une préproduction représentative. Les avertissements webpack sur la sérialisation de chaînes de 106 et 253 Kio sont P3 et n’empêchent pas les builds.
