# AI Test Report

Date : 2026-07-24. Suite dédiée : qualité des données, règles, retard, saturation, anomalie, fiabilité, simulation, workflow humain, rôle, pays, indisponibilité, mode dégradé, injection, fuite inter-pays et charge locale.

Résultats exécutés : lint sans avertissement; TypeScript strict réussi; 52 fichiers et 305/305 tests réussis, dont 16 tests dédiés. Le benchmark local `npm run profile:operational-ai` a mesuré 100 000 évaluations, p50 0,0001 ms, p75 0,0002 ms, p95 0,0004 ms, p99 0,0010 ms, environ 979 290 opérations/s et 0 % d’erreur. Cette mesure Node mono-processus ne remplace pas une charge Supabase/préproduction.

Audit distant après migration : 128 tables et 11 buckets accessibles; RLS/policies présentes; aucun RPC audité exposé de manière non sûre. Projet contrôlé : `rgcgtcycbiuhcaoaadbh`.

Les six builds production ont réussi : application principale (85 pages), User, Collection, Relay, Hub (23 pages) et Admin (19 pages). Deux migrations d’intelligence ont été appliquées; la seconde ferme le défaut P0 de portée du RPC de décision.

Scénarios métier à recetter avec comptes réels : chauffeur (aucune décision), superviseur (approuver/rejeter), hub/relais (périmètre affecté), support, finance, douane, direction et partenaire Orange (partenaire uniquement). Cette recette n’est pas déclarée réussie tant qu’elle n’est pas exécutée.
