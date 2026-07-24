# Journal de remédiation traçabilité

Dernière mise à jour : 24 juillet 2026.

## Défauts fermés

| Criticité | Cause | Correction | Test/validation | Régression |
|---|---|---|---|---|
| P1 | transfert sensible finalisable par une seule RPC | registre de double validation et deux identités distinctes | 5 tests domaine + 5 tests SQL | aucune détectée |
| P1 | preuve vérifiée comptée sans contrôler son type | contrôle des types exacts par étape | preuve manquante et étape complète testées | aucune détectée |
| P1 | RPC générique contournant la double validation | transitions sensibles refusées, finalisation interne uniquement | contrat SQL | aucune détectée |
| P1 sécurité | helpers créés exécutables par défaut par `service_role` | révocation ACL dédiée | audit RLS/RPC vert | aucune exposition résiduelle |
| P1 sécurité | Admin sans facteur pouvait éviter AAL2 | middleware fail-closed et redirection enrôlement | tests source et build Admin | aucune détectée |
| P1 exploitation | aucun chemin d'enrôlement MFA | page TOTP avec challenge/verify | build et rendu navigateur | activation réelle restante |
| P1 exploitation | récupération MFA non définie | procédure hors bande à deux agents et invalidation des sessions | page rendue et test de contrat | exercice réel restant |
| P2 | absence d'audit automatique des colis recette | `traceability-field-audit.mjs` | `--check` fail-closed | données recette requises |
| P2 | profil PostgreSQL incomplet | percentiles, débit, octets, connexions, locks, deadlocks, requêtes lentes et EXPLAIN | `--check` fail-closed | environnement requis |
| P2 | checklist matériel non signable | fiches Android/iOS/navigateurs et signatures | revue documentaire | campagne réelle restante |
| P2 | pagination PDF orpheline | reprise d'en-tête et test PDF | rendu quatre pages | aucune détectée |

## Problèmes ouverts

| Criticité | Problème | Dépendance | Clôture attendue |
|---|---|---|---|
| P1 validation | `proof_count = 0` historique | colis recette et acteurs réels | preuves via APIs, audit vert |
| P1 validation | double validation non exercée sur le terrain | deux comptes par transfert | parcours nominal et négatif signé |
| P1 validation | MFA sensible non exercé | appareils TOTP et procédure sécurité | activation, invalidité, récupération, révocation |
| P1 validation | charge PostgreSQL absente | préproduction autorisée | mesures et EXPLAIN avant/après |
| P1 validation | Android/iOS non testés | appareils physiques | checklist signée |
| P1 validation | Chrome/Edge/Safari non testés | postes/navigateurs réels | checklist signée |
| P2 externe | rétention/restauration | juridique et exploitation | avis et exercice signés |

## Reprise exacte

1. Déployer les changements sur la préproduction autorisée.
2. Enrôler les rôles sensibles et tester récupération/révocation.
3. Créer le colis synthétique via User App.
4. Exécuter les huit transferts et cas négatifs de `TRACEABILITY_FIELD_RECIPE.md`.
5. Lancer `npm run audit:traceability-field`.
6. Lancer la campagne PostgreSQL et les EXPLAIN.
7. Signer les checklists matériel/navigateurs.
8. Rejouer tous les audits avant de réévaluer le verdict.
