# Hub Enterprise — architecture

`apps/hub-app` reste une application Next.js App Router indépendante. Le catch-all `/hub/[[...segments]]` combine le read model opérationnel historique et `EnterpriseHubState`. Les sessions Supabase lisent les RPC/tables RLS ; les sessions de démonstration utilisent exclusivement des fixtures synthétiques.

Composants : UI dans `src/components/enterprise-pages.tsx`, lecture serveur dans `src/lib/enterprise-data.ts`, exports dans `src/lib/enterprise-export.ts`, résilience dans `src/lib/resilience.ts`, endpoints sous `app/api/hub`. Aucun code AfriCRM Shop n’est utilisé.

La base autorisée est exclusivement `rgcgtcycbiuhcaoaadbh.supabase.co`. Les migrations Enterprise créent le référentiel multi-hubs, les affectations, métriques, alertes, audit append-only, prévisions, exports et métriques système.
