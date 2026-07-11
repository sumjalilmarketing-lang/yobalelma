# Pilot Launch Checklist

Date : 2026-07-11

Statut : non pret pilote.

## Bloquants avant pilote

- Rotater les cles Supabase qui ont ete collees dans la conversation.
- Injecter les variables dans l'environnement securise, sans fichier commite :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL`
- Fournir un moyen d'application migrations :
  - Supabase CLI connectee au projet ;
  - ou URL Postgres/DB password ;
  - ou pipeline CI/CD Supabase.
- Executer `npm install` dans un shell qui contient `npm`.
- Appliquer les migrations et verifier les 37 tables.
- Verifier les 7 buckets Storage.
- Creer les comptes de test par role.
- Executer les 5 E2E reels sans skip.

## Parcours a valider

- Authentification reelle : inscription client, livreur, voyageur, login, logout, reset.
- National : client, expedition Senegal vers Senegal, pickup, dispatch, mission, OTP, preuve, payout liberable.
- International : expedition Senegal vers France, relais, collecte, hub, voyageur, billet, lot, QR retrait, QR destination, payout.
- QR : expiration, revocation, usage unique, mauvais acteur, double scan, incident.
- Dispatch : zones, vehicule, disponibilite, KYC, double acceptation impossible, reaffectation.

## Critere de sortie pilote

- 0 secret dans Git.
- 0 migration manquante.
- 0 test E2E saute.
- RLS verifiee par role.
- Logs et audit trail consultables.
- Procedure rollback documentee.
