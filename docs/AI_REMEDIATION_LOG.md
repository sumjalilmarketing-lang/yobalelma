# AI Remediation Log

| Criticité | Cause | Correction | Test/validation | État |
|---|---|---|---|---|
| P0 | Risque d’action sensible autonome | Approbation humaine, rôle, pays, justification et audit obligatoires | workflow dédié + RPC | Corrigé |
| P0 | Risque de fuite inter-pays | RLS sur chaque artefact et filtrage assistant | test inter-pays | Corrigé en code; recette distante requise |
| P0 | Le premier RPC acceptait les rôles depuis l’appelant | Signature supprimée; rôles et pays lus depuis la recommandation verrouillée en base | migration corrective + audit RPC | Corrigé |
| P1 | Données absentes susceptibles d’être extrapolées | Data Quality Monitor et `missingData` explicite | test données manquantes | Corrigé |
| P1 | Simulation susceptible de modifier le réel | contrat et contrainte `read_only` | test immutabilité | Corrigé |
| P1 | IA comme point unique de panne | repli règles + dispatch manuel | test fournisseur indisponible | Corrigé |
| P2 | “IA” heuristique sur-vendue | méthode et limites obligatoires | tests retard/saturation | Corrigé |
| Ouvert | Historique représentatif insuffisant | collecter, labelliser, valider par pays | validation métier | Externe |
| Ouvert | Charge préproduction et connecteurs officiels | campagne contrôlée | rapport p95/erreurs/DB | Externe |
