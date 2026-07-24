# Architecture de traçabilité colis

## Autorité métier

`parcel_traceability_events` est le journal append-only. `parcel_custody_state` est une projection verrouillée par colis, jamais l’autorité historique. Un transfert est sérialisé par `SELECT ... FOR UPDATE`, validé côté serveur, idempotent et relié au hash précédent. Les tables existantes `shipment_status_events`, `delivery_events`, `relay_scan_events`, QR/OTP et preuves de livraison restent compatibles ; aucun historique n’est réécrit.

## Flux

1. `shipment_packages` initialise une identité colis non réutilisable liée à l’expédition et au code public opaque existant.
2. Les applications soumettent une preuve, puis un événement via les RPC sécurisées.
3. La fonction vérifie rôle/périmètre, détenteur courant, transition, preuve et double livraison.
4. L’événement est ajouté avec numéro de séquence, idempotency key et chaîne de hash.
5. La projection de possession est mise à jour dans la même transaction.
6. Un événement assaini alimente l’outbox Control Tower, le Digital Twin, les snapshots, recommandations et notifications.

## Modèle

- `parcel_traceability_events` : vérité chronologique immuable.
- `parcel_custody_state` : détenteur, position sourcée, étape, ETA, retard, intervenant et confiance.
- `parcel_traceability_proofs` / `parcel_proof_requirements` : preuves vérifiées et règles configurables.
- `parcel_seals` : cycle de vie des scellés sans suppression.
- `parcel_traceability_anomalies` : anomalies assignables et reliables aux incidents.
- `parcel_passport_access_log` : journal des consultations/exports sensibles.

## Surfaces

- API : `/api/traceability/events`, `/api/traceability/proofs`, `/api/traceability/offline-sync`.
- Client : `/tracking/[trackingCode]`, informations filtrées, fraîcheur, étape, ETA et confiance.
- Opérations : `/command/passports?query=...`, dossier complet et recherche depuis le Control Tower.

Migration : `20260722063000_parcel_traceability_passport.sql`.
