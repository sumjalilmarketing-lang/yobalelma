# Production Readiness

Date : 2026-07-11

## Verdict

Statut reel : non pret pour production.

Le projet est pret pour demonstration technique locale et pour une premiere integration Supabase, mais il n'est pas pret pour pilote ni production tant que les migrations ne sont pas appliquees et que les deux parcours principaux ne sont pas executes avec comptes reels.

## Niveau par usage

| Niveau | Statut | Justification |
| --- | --- | --- |
| Pret pour demonstration | Oui, partiel | Build reussi, routes principales presentes, UI et APIs connectees par contrat Supabase. |
| Pret pour test interne | Partiellement | Code et E2E HTTP presents, mais variables Supabase et base distante non verifiees. |
| Pret pour pilote | Non | Parcours national/international reels non executes, paiement reel absent, QR image absent. |
| Pret pour production | Non | Observabilite, RLS distante, support operationnel, paiement, notifications et procedures manquants. |

## Validation executee

- Lint : reussi hors sandbox.
- Typecheck : reussi hors sandbox.
- Tests unitaires : 33/33 reussis.
- E2E : 5 tests HTTP reussis, 5 parcours reels sautes faute de secrets Supabase.
- Build : reussi, 45 pages generees.
- Commandes `npm ...` : toutes bloquees car `npm` n'est pas disponible dans le shell local.

## Blocages de production

- Variables Supabase reelles absentes dans Codex.
- Cles collees dans la conversation utilisateur : rotation recommandee avant tout pilote.
- Migrations non appliquees/verifiees sur Supabase distant.
- Buckets Storage non verifies distantement.
- `npm` absent dans ce shell local ; `npm install` n'a pas pu etre execute litteralement.
- `supabase` CLI absent dans ce shell local ; application automatique des migrations non possible sans outil/DB URL.
- `package-lock.json` doit etre regenere dans un environnement npm apres ajout de Playwright.
- Paiement et notifications restent sandbox/non branches.
