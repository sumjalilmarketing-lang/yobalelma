# Remaining Work

Date : 2026-07-10

## Critique

- Configurer `.env.local` avec l'URL Supabase Yobalelma et la cle publique anon, sans jamais committer de secret.
- Appliquer les migrations au projet Supabase Yobalelma et verifier chaque migration.
- Creer une procedure d'initialisation super admin sans exposer de service key.
- Verifier toutes les policies RLS sur le projet distant avec comptes reels : client, voyageur, transporteur, relay agent, hub agent, support, admin.
- Implementer les parcours E2E manquants : inscription, expedition nationale, mission livreur, scan, livraison, expedition internationale, relais, hub, batch.
- Ajouter une suite Playwright ou equivalente pour tester les parcours critiques dans un navigateur.

## Haute

- Ajouter le choix explicite depot relais ou enlevement dans le flux expedition.
- Creer les APIs et UI pour proposer, accepter, refuser et terminer une mission d'enlevement.
- Creer les actions pickup, in transit, delivered et preuve de remise.
- Ajouter une page tracking publique ou authentifiee par code `YBL-XXXXXXXX`.
- Implementer l'upload reel vers Storage pour KYC, billet/document voyage et preuves de livraison.
- Verifier et creer les buckets Storage necessaires au-dela de `kyc-documents`.
- Generer de vrais QR codes de retrait et depot destination, puis ajouter les scanners correspondants.
- Creer l'interface back-office de gestion des roles internes et des validations KYC.
- Ajouter les notifications email/SMS/in-app pour auth, tracking, scans, support et paiement.

## Moyenne

- Ajouter les vues liste/detail pour expeditions, missions, batches, relais, tickets et paiements.
- Ajouter les dashboards analytics reels depuis `platform_metrics_daily`.
- Ajouter une procedure de seed non sensible pour donnees de demonstration.
- Ajouter des tests SQL/RLS si l'outillage Supabase CLI est disponible.
- Ajouter des tests composants pour les formulaires principaux.
- Ameliorer les erreurs UI quand Supabase n'est pas configure.
- Ajouter une politique de retention et purge des documents KYC.
- Ajouter l'historique complet d'audit dans le dashboard admin.

## Faible

- Ajouter QR visuel imprime/exportable pour lots.
- Ajouter filtres et recherche dans support/admin.
- Ajouter etiquettes colis et documents PDF.
- Ajouter i18n complet fr/en.
- Ajouter skeleton loading et etats vides plus riches.
- Ajouter guide operateur pour relais/hub/livreur.
