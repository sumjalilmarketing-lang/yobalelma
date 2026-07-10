# Remaining Work

Date : 2026-07-11

## Critique

- Fournir `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` et `NEXT_PUBLIC_APP_URL` dans l'environnement securise.
- Injecter `SUPABASE_ACCESS_TOKEN` dans l'environnement securise ou connecter le dashboard Supabase/GitHub.
- Fournir le mot de passe Postgres ou un `--db-url` securise pour `supabase db push`.
- Appliquer toutes les migrations au Supabase Yobalelma et verifier les 37 tables, 7 buckets, policies RLS et RPC.
- Creer comptes de test par role : client, local_transporter, traveler, relay_agent, collection_driver, hub_agent, operations_manager, admin.
- Executer les parcours nationaux et internationaux reels avec donnees seed controlees.
- Corriger toute erreur RLS observee sur la base distante.

## Haute

- Ajouter rendu QR image imprimable/exportable autour des tokens opaques.
- Ajouter page tracking publique par code `YBL-XXXXXXXX`.
- Finaliser validation back-office KYC et billet voyage.
- Ajouter upload direct UX vers Storage avec URL signee, preview et preuve de livraison.
- Ajouter notifications email/SMS/in-app pour auth, mission, tracking, QR et support.
- Brancher paiement reel ou definir explicitement un pilote sans paiement reel.
- Ajouter seed non sensible et script de reset environnement test.

## Moyenne

- Ajouter filtres/recherche sur listes expeditions, missions, relais, hub, support.
- Ajouter dashboards analytics depuis `platform_metrics_daily`.
- Ajouter tests RLS SQL si Supabase CLI et credentials sont disponibles.
- Ajouter tests composants React pour les formulaires principaux.
- Ajouter gestion avancee des incidents et litiges.

## Faible

- Ajouter i18n complet fr/en.
- Ajouter etiquettes colis PDF.
- Ajouter guide operateur relais/hub/collecte.
- Ajouter skeleton loading et exports CSV.
