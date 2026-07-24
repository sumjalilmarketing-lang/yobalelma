# Runbooks et réponse aux incidents

## Sévérités et responsabilités

- P0 : sécurité, perte de données ou indisponibilité globale ; astreinte immédiate, gel des changements.
- P1 : impact métier majeur ; responsable d’incident nommé sous 15 min.
- P2/P3 : traitement planifié avec preuve de correction.

## Procédure

1. Qualifier l’impact, le pays, les missions, colis, utilisateurs et services.
2. Ouvrir l’incident, affecter un responsable et conserver le journal de décision.
3. Contenir : désactiver le connecteur fautif, mettre en pause le worker ou basculer en traitement manuel contrôlé.
4. Vérifier outbox, dead-letter, santé modules, erreurs fournisseurs et fraîcheur GPS.
5. Restaurer progressivement et surveiller les critères de retour à la normale.
6. Produire un post-mortem sans blâme avec actions datées.

## Sauvegarde, RPO et RTO

Objectifs à faire approuver : RPO ≤ 15 min pour événements/paiements, RTO ≤ 4 h pour le cœur opérationnel. Une restauration doit toujours cibler une base isolée, jamais la production. Exécuter `verify-disaster-recovery.mjs` avec `DR_SOURCE_URL` et `DR_RESTORE_TARGET_URL`, comparer schéma, comptes et invariants, puis détruire la cible selon la politique de rétention.

## Rollback

Avant migration sensible : sauvegarde vérifiée, migration idempotente, plan de compensation, validation RLS et fenêtre d’exploitation. Ne jamais faire de rollback destructif sans preuve de sauvegarde. Le worker est arrêté avant toute intervention affectant l’ordre des événements.
