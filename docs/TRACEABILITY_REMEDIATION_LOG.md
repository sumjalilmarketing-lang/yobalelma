# Journal de remédiation traçabilité

## Fermé

- P1 — écritures de manifeste fragmentées : remplacées par `add_collection_manifest_item_traced`.
- P1 — rangement relais direct : remplacé par `record_relay_storage_traced` idempotent.
- P1 — mutations héritées sans passeport : triggers transactionnels Collection, Relay, Hub, livraison, douane, incidents et corrections.
- P1 — changement de statut contournable : constraint trigger différé imposant le journal dans la transaction.
- P1 — scellés non opérables : RPC avec preuve photo vérifiée et anomalie sur rupture inattendue.
- P1 — PDF absent : export serveur, bucket privé, URL signée cinq minutes, journal d’accès et bouton Admin.
- P1 sécurité détecté par audit — helper interne exécutable par `service_role` : droit retiré par la migration `20260722065000` et audit repassé au vert.
- P2 — pagination PDF orpheline : section répétée à la coupure, rendu réinspecté.
- P2 — test de contrat non portable Windows : résolution des chemins corrigée.
- P1 de validation — relance locale après `20260722066000` : lint sans avertissement, TypeScript strict, 49 fichiers/275 tests et build racine verts.
- P2 outillage — `.next-browser-smoke` ajouté aux exclusions Git et ESLint afin que les artefacts de smoke test ne polluent plus le lint global.
- P1 — migration `20260722066000` paiements/notifications appliquée au projet Yobalelma ; zéro migration en attente.
- P1 sécurité/cohérence — audits distants relancés le 24 juillet 2026 : traçabilité, RLS/RPC, 118 tables et 11 buckets verts.

## Ouvert

- P1 de validation — recette authentifiée multi-rôles non exécutée faute de staging et de comptes dédiés.
- P1 de validation — charge PostgreSQL préproduction non exécutée faute de projet staging autorisé.
- P1 de validation — matériel réel QR/caméra/GPS/photo/signature non disponible.
- P2 — validation juridique finale de rétention et exercice réel de restauration restent externes à cette passe.

## Reprise exacte

1. Préparer un environnement de recette isolé utilisant exclusivement le projet Yobalelma autorisé `rgcgtcycbiuhcaoaadbh`, avec sept comptes E2E dédiés et un colis de charge non productif.
2. Exécuter la recette multi-rôles et les refus d’accès croisés.
3. Exécuter la charge PostgreSQL contrôlée hors données de production.
4. Signer la checklist sur appareils réels.
