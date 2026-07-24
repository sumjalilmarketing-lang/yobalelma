# Recette terrain contrôlée — traçabilité Yobalelma

Cette recette est exécutable uniquement dans un environnement de préproduction explicitement autorisé. Le projet de production `rgcgtcycbiuhcaoaadbh` ne doit jamais recevoir de charge ou de colis de recette.

## Identification obligatoire

- scénario : `YBL-FIELD-<AAAAMMJJ>-<numéro>` ;
- colis : créé par l'API User App, avec `metadata.recipe_id` égal au scénario ;
- données : noms, téléphones, photos et signatures synthétiques ;
- comptes : expéditeur, relais départ, chauffeur national, hub origine, voyageur/transporteur, hub destination, chauffeur dernier kilomètre, relais destination et destinataire ;
- preuve de préparation : URL, référence d'environnement, identifiants des comptes, colis, missions, véhicule et lieux consignés dans le procès-verbal ;
- interdiction : aucune insertion manuelle dans `parcel_traceability_proofs`, `parcel_traceability_events`, `parcel_custody_state` ou `parcel_custody_transfer_requests`.

## Parcours nominal

| Étape | Détenteur avant | Détenteur après | État avant → après | Preuves obligatoires | Mission/véhicule | Validation |
|---|---|---|---|---|---|---|
| 1 | client expéditeur | relais départ | `created` → `at_origin_relay` | QR, photo, GPS | dépôt | remettant + receveur |
| 2 | relais départ | chauffeur national | `at_origin_relay` → `with_collection_driver` | QR, confirmation serveur, GPS | collecte + véhicule | remettant + receveur |
| 3 | chauffeur national | hub origine | `with_collection_driver` → `at_origin_hub` | QR, confirmation serveur, GPS | collecte + véhicule | remettant + receveur |
| 4 | hub origine | voyageur/transporteur | `at_origin_hub` → `with_traveler` | QR, identité, signature | voyage | remettant + receveur |
| 5 | voyageur/transporteur | hub destination | `with_traveler` → `at_destination_hub` | QR, confirmation serveur, GPS | voyage | remettant + receveur |
| 6 | hub destination | chauffeur dernier kilomètre | `at_destination_hub` → `with_last_mile_driver` | QR, confirmation serveur, GPS | livraison + véhicule | remettant + receveur |
| 7 | chauffeur dernier kilomètre | relais destination | `with_last_mile_driver` → `at_destination_relay` | QR, confirmation serveur, GPS | livraison + véhicule | remettant + receveur |
| 8 | relais destination | destinataire | `at_destination_relay` → `delivered` | OTP, signature, remise, GPS | remise finale | remettant + receveur |

## Protocole de chaque transfert

1. Le remettant s'authentifie et capture les preuves via les APIs terrain : QR/OTP dédié, upload signé pour la photo, capture GPS consentie et signature.
2. Les identifiants des preuves sont transmis à `request_parcel_custody_transfer`. La demande enregistre la première validation et reste `pending`.
3. Vérifier immédiatement que le détenteur et l'état du colis n'ont pas changé.
4. Le receveur s'authentifie sur un compte distinct et appelle `decide_parcel_custody_transfer` avec sa position.
5. La seconde validation vérifie l'identité, l'expiration, la distance maximale de 2 km et les types exacts de preuves. Elle atteste les preuves du remettant puis écrit l'événement et le nouveau détenteur dans la même transaction.
6. Capturer le Passeport Logistique, le Digital Twin, l'événement Control Tower et la notification avant de poursuivre.
7. Rejouer la décision avec la même clé : le résultat doit être idempotent. Rejouer avec une autre clé : la demande doit être refusée comme finalisée.

## Cas négatifs obligatoires

| Cas | Précondition | Action | Résultat attendu |
|---|---|---|---|
| Première validation seule | demande créée | ne pas confirmer côté receveur | statut `pending`, détenteur inchangé |
| Refus | demande active | remettant ou receveur refuse avec motif | statut `rejected`, détenteur inchangé |
| Expiration | TTL dépassé | confirmer | statut `expired`, aucun événement de transfert |
| Absence réseau | appareil offline | soumettre puis reprendre | file offline conservée, une seule demande après reprise |
| Double clic | même clé | envoyer deux fois | un seul transfert |
| Rejeu | transfert finalisé | nouvelle clé de décision | refus `already finalized` |
| Acteur incorrect | compte tiers | confirmer/refuser | refus d'identité |
| Position incohérente | distance > 2 km | confirmer | refus de position |
| Preuve manquante | retirer un type obligatoire | demander/confirmer | refus, `proof_count` inchangé |
| Double livraison | colis livré | confirmer de nouveau | refus, une seule livraison confirmée |

## Contrôle final automatique

Configurer uniquement la préproduction autorisée :

```powershell
$env:TRACEABILITY_STAGING_PROJECT_REF = "<référence autorisée>"
$env:TRACEABILITY_RECIPE_SHIPMENT_IDS = "<uuid-colis-1>,<uuid-colis-2>"
npm run audit:traceability-field
```

L'audit exige : séquences continues, hashes liés, détenteur unique, `proof_count > 0`, preuves finales, double validation de tous les transferts sensibles, aucune double livraison, Passeport cohérent, événements Control Tower, Digital Twin, notification et export PDF journalisé.

## Procès-verbal

| Champ | Valeur |
|---|---|
| Environnement et autorisation | |
| Scénario / colis | |
| Date début / fin | |
| Testeurs et rôles | |
| Appareils / OS / applications | |
| Résultat audit automatique | |
| Anomalies | |
| Liens captures/vidéos | |
| Signature responsable recette | |
| Signature sécurité/exploitation | |
