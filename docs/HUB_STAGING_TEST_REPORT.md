# Hub staging test report

## Résultats

- Lint monorepo : réussi, zéro avertissement.
- Typecheck strict : réussi.
- Tests unitaires/intégration Vitest : 115/115 réussis, 21 fichiers.
- Tests Hub unitaires ciblés : 18/18 réussis.
- E2E Hub local : 18/18 réussis.
- E2E staging réel : parcours métier complet réussi ; Auth staging ciblée réussie après relance.
- Build Hub indépendant : réussi, 20 routes.
- Build monorepo : réussi, 76 pages générées.
- Smoke HTTPS : connexion HTTP 200, health HTTP 200 avec Supabase `ok`.

## Parcours HTTPS contrôlé

Dashboard, réception, scanner, inspection, inventaire, stockage, voyages, capacités, lots, QR, remise, anomalies, notifications et profil ont été rendus depuis Supabase. Le parcours pilote a reçu `YBL-PILOT001`, déclaré `YBL-PILOT002` endommagé, inspecté et stocké le premier colis, réservé 4,2 kg, généré/consommé un QR puis créé le suivi et les audits.

Une erreur `ERR_SSL_PROTOCOL_ERROR` transitoire du Quick Tunnel est survenue sur une navigation du premier test Auth. Le parcours métier suivant a réussi et le test Auth, modifié avec une reprise réseau bornée et le vrai bouton de déconnexion, a ensuite réussi.
