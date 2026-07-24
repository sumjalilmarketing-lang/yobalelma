# AI Decision Center

La vue `Control Tower > AI Decision Center` regroupe les recommandations proposées, reconnues, approuvées, rejetées, expirées et exécutées, avec la nature du calcul, sa confiance, ses limites et son expiration.

Les décisions sensibles exigent un rôle et un pays autorisés ainsi qu’une justification. Le RPC `record_operational_ai_decision` verrouille la dernière étape, refuse les transitions hors de `pending` et écrit un audit. Le moteur ne déclenche pas lui-même de reroutage, paiement, communication, décision douanière ou transfert de possession.

L’interface actuelle fournit la supervision et les états. L’édition interactive complète (modifier puis simuler avant validation) requiert encore une recette métier authentifiée avant pilote.
