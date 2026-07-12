# Pilot Launch Checklist

Date : 2026-07-12

Statut : non pret pilote.

## Bloquants avant pilote

- Rotater les cles Supabase qui ont ete collees dans la conversation.
- Garder les variables dans l'environnement securise, sans fichier commite :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_ACCESS_TOKEN`
  - `DATABASE_URL`
  - `NEXT_PUBLIC_APP_URL`
- Maintenir la Supabase CLI liee au projet Yobalelma et verifier l'historique avant chaque migration.
- Verifier les 46 tables REST existantes apres migration.
- Verifier les 7 buckets Storage avec des uploads par role.
- Creer les comptes de test par role.
- Executer les parcours authentifies complets par role.

## Parcours a valider

- Authentification reelle : inscription client, livreur, voyageur, login, logout, reset.
- National : client, expedition Senegal vers Senegal, pickup, dispatch, mission, OTP, preuve, payout liberable.
- International : expedition Senegal vers France, relais, collecte, hub, voyageur, billet, lot, QR retrait, QR destination, payout.
- QR : expiration, revocation, usage unique, mauvais acteur, double scan, incident.
- Dispatch : zones, vehicule, disponibilite, KYC, double acceptation impossible, reaffectation.

## Critere de sortie pilote

- 0 secret dans Git.
- 0 migration locale non appliquee.
- 0 test E2E saute ou superficiel sur parcours critique.
- RLS verifiee par role.
- Logs et audit trail consultables.
- Procedure rollback documentee.
