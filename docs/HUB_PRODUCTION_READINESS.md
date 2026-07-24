# Hub production readiness

## Niveau atteint

Le Hub est prêt pour **démonstration et test interne**. Le workflow réel, Supabase Auth, RLS, concurrence, builds, E2E et responsive sont validés. Aucun bug critique applicatif connu ne reste ouvert.

## Conditions avant pilote

- déployer le commit validé sur Vercel ou un VPS Node.js supervisé ;
- associer `hub.yobalelma.com` et remplacer le Site URL Supabase temporaire ;
- stocker les secrets dans le gestionnaire du fournisseur ;
- ajouter monitoring externe, rétention centralisée des logs et alertes ;
- tester le reset password avec une boîte réelle et la politique email finale ;
- exécuter charge, sauvegarde/restauration et plan de reprise ;
- définir rotation des comptes pilotes et support d’incident.

## Conditions avant production

Audit sécurité indépendant, SLA, haute disponibilité, CI/CD avec approbation, migrations automatisées réversibles, observabilité centralisée, tests de charge dimensionnés et validation métier terrain.
