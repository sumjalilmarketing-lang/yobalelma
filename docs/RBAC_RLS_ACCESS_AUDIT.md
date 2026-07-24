# Audit RBAC, ABAC et RLS

## Méthode et preuves

Audit distant `scripts/supabase-security-audit.mjs`, tests Vitest RBAC/sécurité et E2E de routes. Résultat : 111 tables accessibles contrôlées ; toutes les tables inventoriées ont RLS et au moins une politique attendue ; aucune fonction service-only n’est exécutable par `anon` ou `authenticated`.

Les données Control Tower sont filtrées par rôle, pays, affectation Hub/Relais et politiques serveur. L’outbox a une politique explicite `using (false) with check (false)`. Les partenaires ne reçoivent que leur vue autorisée et restent soumis aux politiques base.

## E2E

- 28 routes protégées redirigent correctement les anonymes.
- Client, voyageur, livreur, relais, Hub, collecte, opérations, support et admin atteignent leur espace attendu.
- Un client est redirigé hors de l’espace Hub.

## Risques résiduels

Une matrice authentifiée exhaustive pays/ville/Hub/Relais/partenaire reste à exécuter en préproduction. Aucun contrôle critique identifié ne repose uniquement sur le client.
