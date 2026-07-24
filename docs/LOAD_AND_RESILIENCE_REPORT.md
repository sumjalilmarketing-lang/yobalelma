# Rapport charge et résilience

## Tests réalisés

- Replay déterministe de 250 000 événements : 301 ms, 830 565 événements/s, +32 Mo.
- Test unitaire de 50 000 événements sous le seuil de 5 s.
- Outbox : verrouillage `skip locked`, idempotence, 8 tentatives, backoff exponentiel et dead-letter vérifiés par tests et migration.
- Rejeu hors ordre : tri déterministe par horodatage puis identifiant de source.

## Reprise

Le script `verify-disaster-recovery.mjs` refuse de s’exécuter sans `DR_SOURCE_URL` et `DR_RESTORE_TARGET_URL`. Ce comportement fail-closed est correct, mais la restauration n’est pas prouvée. RPO/RTO cibles et procédure figurent dans `RUNBOOKS_AND_INCIDENT_RESPONSE.md`.

## Non exécuté

Charge multi-utilisateur, GPS simultané, saturation contrôlée, panne fournisseur, base ralentie, reprise réelle et restauration complète : environnement de préproduction représentatif absent. Aucun test dangereux n’a été lancé sur la production.
