# Audit final de traçabilité

Dernière validation : 24 juillet 2026.

## État distant vérifié

- projet unique : `https://rgcgtcycbiuhcaoaadbh.supabase.co` ;
- 68 migrations, zéro attente ;
- 119 tables et 11 buckets ;
- 70 colis, 70 états et 70 événements historiques ;
- `proof_count = 0` ;
- zéro anomalie active, trou de séquence, lien cassé, état incohérent, détenteur absent ou double livraison ;
- audit sécurité RLS/RPC réussi après correction des ACL internes.

## Double validation appliquée

Les migrations `20260724090000_dual_custody_transfer_validation.sql` et `20260724091000_lock_dual_transfer_internals.sql` ajoutent :

- un registre RLS de demandes de transfert ;
- un remettant et un receveur obligatoirement distincts ;
- un état `pending` après la première validation, sans changement de détenteur ;
- confirmation ou refus par un acteur autorisé ;
- expiration maximale de 60 minutes ;
- refus des positions de réception distantes de plus de 2 km ;
- clés d'idempotence de demande et décision ;
- preuve exacte par étape, photo avec objet stocké et GPS avec coordonnées ;
- attestation des preuves du remettant uniquement par le receveur ;
- finalisation de l'événement et de la possession dans une transaction ;
- blocage des transferts sensibles via l'ancienne RPC générique ;
- helpers internes non exécutables directement, y compris par `service_role`.

Le comportement a été validé par 14 tests ciblés couvrant succès, première validation seule, refus, expiration, acteur incorrect, position incohérente, preuves manquantes, double clic/rejeu et audit complet.

## MFA

- middleware Admin fail-closed : toute session protégée doit atteindre AAL2 ;
- compte sans facteur redirigé vers l'enrôlement TOTP ;
- code invalide n'accorde aucun accès ;
- récupération documentée avec contrôle hors bande, deux agents, révocation du facteur et invalidation des sessions ;
- rôles pilotes couverts par l'outil : `super_admin`, `admin`, `operations_manager`, `country_manager`, `finance_manager`, `security_manager`, `auditor`.

Les pages d'enrôlement et récupération ont été construites et rendues localement. Aucun facteur réel n'a été créé, révoqué ou récupéré durant cette passe.

## Validation logicielle

- ESLint : réussi, zéro avertissement ;
- TypeScript strict : réussi ;
- Vitest : 51 fichiers, 289/289 tests ;
- builds : racine 85, User 56, Collection 14, Relay 14, Hub 23, Admin 19 pages ;
- navigateur intégré : écrans MFA localement lisibles, largeur document/viewport 1280/1280 ;
- Supabase : migrations, inventaire, sécurité et cohérence réussis.

## Audit terrain préparé, non exécuté

`scripts/traceability-field-audit.mjs` vérifie automatiquement, pour les colis recette : chaîne complète, séquences, hashes, détenteur unique, preuves, double validation, absence de double livraison, Passeport, Digital Twin, Control Tower, notification, preuve finale et export PDF.

Le contrôle `--check` retourne non prêt : aucune référence préproduction ni aucun colis recette ne sont fournis. Aucune preuve artificielle n'a été injectée et aucune donnée de production n'a été utilisée.
