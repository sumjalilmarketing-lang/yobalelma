# Rapport de tests Hub Enterprise

Date : 2026-07-17.

- Migration SQL Enterprise et fixtures : appliquées avec succès (31 migrations connues).
- TypeScript strict et ESLint Hub : réussis.
- Unitaires Hub : 22/22.
- E2E local : 33 scénarios exécutés ; 24 réussis au premier passage, 9 corrigés puis 10/10 ciblés réussis. Galerie : 1/1.
- Staging Supabase réel : non rejoué dans cette session faute de `HUB_PILOT_PASSWORD`; la phase précédente l’avait validé.
- Charge : 100 agents virtuels, 300 requêtes, 0 erreur. p50 21,0 s, p95 24,9 s sur Next dev ; seuil p95 non atteint. Benchmarks 1 000/10 000 colis : 0,50/2,44 ms, heap 15,6/17,9 Mio.

Conclusion charge : le résultat développeur ne qualifie pas la production. Rejouer sur build production et hébergement durable avec métriques CPU/Supabase.
