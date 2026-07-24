# Dépendances externes

| Dépendance | État | Requis |
|---|---|---|
| Cartographie, routage, trafic | non connectée | contrat, gateway, jetons restreints, quotas |
| Worker Control Tower | non déployé | runtime privé, secret service, supervision, astreinte |
| Push, e-mail, SMS | adaptateurs préparés | comptes fournisseurs, domaines, webhooks |
| WhatsApp | désactivé | Business officiel, modèles approuvés |
| Orange Money | production bloquée | identifiants, sandbox, homologation, webhooks |
| Orange Relais | fondation prête | catalogue officiel, contrat et synchronisation |
| Douanes/GAINDE/ORBUS | manuel contrôlé | mandats, certificats, sandbox, homologation |
| Observabilité | non connectée | destination logs/métriques, alertes, astreinte |
| Reprise | non vérifiée | source DR et cible de restauration isolée |
| Charge distribuée | non exécutée | préproduction représentative et SLO |
| Recette Admin visuelle | bloquée | `ADMIN_E2E_PASSWORD` pilote autorisé |

Aucun connecteur absent n’est présenté comme opérationnel et aucune fausse clé n’a été ajoutée.
