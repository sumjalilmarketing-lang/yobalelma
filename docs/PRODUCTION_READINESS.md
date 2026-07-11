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
| Pret pour production | Non | Observabilite, RLS distante, support operationnel, paiement reel, notifications externes et procedures manquants. |

## Validation executee

- Lint : reussi hors sandbox.
- Typecheck : reussi hors sandbox.
- Tests unitaires : 37/37 reussis.
- E2E : 5 tests HTTP reussis, 5 parcours reels sautes faute de secrets Supabase.
- Build : reussi, 49 pages generees.
- `npm install` : reussi avec Node.js 22 LTS temporaire, 0 vulnerabilite.
- Commandes `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` : reussies.
- Commande `npm run test:e2e` : 5 tests reussis, 5 parcours reels sautes faute d'environnement Supabase authentifie.
- Connectivite Supabase : URL projet joignable, reponse non authentifiee `401 UNAUTHORIZED_MISSING_API_KEY`.
- Dashboard Supabase : acces bloque sur connexion GitHub/Supabase dans le navigateur integre.
- Validation Supabase automatisee : script `npm run validate:supabase` ajoute, execution bloquee tant que les variables ne sont pas injectees.
- Supabase CLI : `v2.109.1` telechargee temporairement, `supabase init` execute, `supabase/config.toml` ajoute.

## Blocages de production

- Variables Supabase reelles absentes dans Codex.
- Cles collees dans la conversation utilisateur : rotation recommandee avant tout pilote.
- Migrations non appliquees/verifiees sur Supabase distant.
- Buckets Storage non verifies distantement.
- Connexion dashboard Supabase requiert une intervention humaine GitHub/Supabase.
- Token Supabase fourni dans le chat mais non utilisable en ligne de commande sans exposition process/logs ; il doit etre injecte sous `SUPABASE_ACCESS_TOKEN`.
- Mot de passe Postgres ou `--db-url` requis pour appliquer les migrations via `supabase db push`.
- Paiement reel et providers de notifications externes restent non branches ; le modele in-app est present dans le schema local.
