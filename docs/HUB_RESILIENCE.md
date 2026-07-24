# Résilience Hub

`withRetry` applique un backoff exponentiel borné. `createIdempotencyKey` fournit une clé stable et `enqueueDeferredAction` déduplique une file locale plafonnée. Les RPC critiques existantes conservent leurs protections transactionnelles et d’idempotence.

En cas de panne, l’UI expose un état dégradé, les lectures Enterprise disposent d’un fallback synthétique uniquement en démonstration, et les données réelles ne sont jamais remplacées silencieusement en production.
