# Préparation production — traçabilité

Dernière validation : 24 juillet 2026.

## Verdict strict

**B.**

**TRAÇABILITÉ TECHNIQUE VALIDÉE**
**VALIDATIONS TERRAIN RESTANTES**

Le verdict A est interdit : aucune recette complète n'a produit de preuves réelles sur un colis de démonstration, aucun facteur MFA sensible n'a été réellement enrôlé et testé de bout en bout, aucune campagne PostgreSQL préproduction autorisée n'a été exécutée, et les essais Android/iOS/Chrome/Edge/Safari réels ne sont pas signés.

## Validations réellement exécutées

- 68 migrations appliquées, zéro migration en attente ;
- 119 tables et 11 buckets contrôlés ;
- 70/70 colis historiques cohérents, zéro trou de séquence, hash cassé, double livraison, anomalie active ou détenteur absent ;
- audit RLS/RPC vert : aucune fonction attendue absente, aucune exposition dangereuse `anon`, `authenticated`, `service_role` ou helper interne ;
- double validation transactionnelle appliquée : demande du remettant, décision distincte du receveur, expiration, refus, position maximale de 2 km, idempotence et finalisation atomique ;
- API générique interdite pour les transferts sensibles afin d'empêcher le contournement ;
- types exacts de preuves exigés pour chaque étape terrain ; seules les preuves du remettant peuvent être attestées par le receveur ;
- MFA Admin passé en fail-closed AAL2, avec pages d'enrôlement TOTP et récupération contrôlée ;
- lint sans avertissement, TypeScript strict, 51 fichiers et 289/289 tests réussis ;
- six builds réussis : racine 85 pages, User 56, Collection 14, Relay 14, Hub 23 et Admin 19 ;
- pages MFA d'enrôlement et récupération rendues dans le navigateur intégré, sans overflow ;
- scénario terrain, audit automatique, profil PostgreSQL/EXPLAIN et checklists signables ajoutés ;
- campagne locale non persistante d'un million d'événements réalisée précédemment.

## Tests non exécutés

- création d'un colis recette via User App et parcours des huit transferts ;
- création réelle de QR, OTP, photo, GPS et signature via les applications terrain ;
- passage de `proof_count` au-dessus de zéro sur un colis recette ;
- confirmation/refus/expiration/rejeu de la nouvelle double validation avec deux comptes réels ;
- enrôlement, code invalide, révocation, récupération et session expirée MFA sur comptes sensibles ;
- mesures PostgreSQL réelles et `EXPLAIN ANALYZE` en préproduction ;
- appareils Android/iOS et Chrome/Edge/Safari réels.

## Risques résiduels

- `proof_count = 0` demeure sur les 70 colis historiques ;
- la migration de double validation est appliquée mais n'a pas encore été exercée par un parcours terrain réel ;
- les nouvelles pages MFA sont construites et contrôlées localement mais pas déployées ni utilisées pour enrôler les rôles sensibles ;
- aucune latence PostgreSQL, lock, deadlock, connexion, requête lente, CPU ou mémoire serveur n'est mesurée ;
- aucun procès-verbal matériel n'est signé.

## Conditions pour A

Exécuter et signer [la recette terrain](./TRACEABILITY_FIELD_RECIPE.md), l'audit automatique sans échec, l'enrôlement/récupération MFA des rôles sensibles, la campagne PostgreSQL autorisée et [la checklist appareils/navigateurs](./TRACEABILITY_DEVICE_BROWSER_CHECKLIST.md).
