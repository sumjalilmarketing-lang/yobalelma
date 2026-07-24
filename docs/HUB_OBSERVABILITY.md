# Observabilité Hub

`/hub/system-health` présente Supabase, Auth, Storage, Realtime, API, scanner, latence, disponibilité et version. `hub_system_metrics` conserve les mesures hub/service. Les erreurs API retournent un message minimisé et, pour la recherche, un identifiant de corrélation.

Seuils : taux d’erreur < 1 %, p95 page < 1 500 ms, p95 recherche < 750 ms en environnement de production dimensionné.
