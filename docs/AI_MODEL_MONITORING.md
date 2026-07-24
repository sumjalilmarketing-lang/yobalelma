# AI Model Monitoring

`operational_ai_monitoring` conserve p50/p95/p99, erreur, disponibilité, données manquantes, rejets, faux positifs, faux négatifs, dérive et coût. Les fenêtres sont horodatées et séparées par pays/module/version.

Alertes recommandées : indisponibilité immédiate; erreur > 2 %; données manquantes > 10 %; dérive > seuil validé; hausse des rejets > 20 points; p95 au-delà du budget métier. Aucun seuil ne modifie automatiquement un modèle.

Le registre exige lignage, échantillon, limites, métriques et approbateur. Le réentraînement production automatique est interdit.
