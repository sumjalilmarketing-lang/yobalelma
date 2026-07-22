# Audit global de préparation Yobalelma — mise à jour du 22 juillet 2026

## Verdict exécutif

**Yobalelma n’est toujours pas prête pour un lancement national et n’est pas prête pour un lancement international.**

La note passe de **56/100 à 64/100**. Cette progression repose sur des corrections vérifiées : suppression des fixtures dans les lectures opérationnelles Collection et Hub, échec fermé des mutations simulées, GPS Collection persisté et autorisé côté serveur, contrôle Relay atomique, chaîne KYC transactionnelle avec quarantaine obligatoire, health checks fiables, surveillance synthétique, runbooks d’observabilité et de reprise, correction de deux défauts SQL de production et validation renforcée des rôles pilotes.

Les blocages de lancement ne peuvent pas être levés par du code local seul : fournisseur de paiement et de reversement réel, moteur antimalware, notifications multicanales, restauration sur une cible isolée, tests de charge des workflows, APM/astreinte avec preuve de réception, validation juridique multi-pays et recette matérielle/mobile complète.

## Comparaison des notes

| Domaine | 21 juillet | 22 juillet | Évolution et preuve |
|---|---:|---:|---|
| Architecture | 66 | 72 | Lectures live validées par Zod, mutations Relay/KYC atomiques, échec fermé. |
| Sécurité | 72 | 79 | Uploads enregistrés en quarantaine, décisions KYC atomiques, audit RLS/RBAC et lint SQL propres. |
| Performance | 68 | 70 | 250 probes sans erreur ; charge métier nationale toujours absente. |
| UX | 58 | 64 | Suppression de faux succès et de métriques inventées ; états vides professionnels. |
| UI | 76 | 77 | Cohérence conservée ; audit visuel exhaustif non rejoué. |
| Accessibilité | 65 | 66 | E2E responsive ciblés ; campagne WCAG 2.2 AA toujours absente. |
| Internationalisation | 44 | 44 | Aucun progrès probant sur les traductions et règles pays. |
| Workflow métier | 49 | 61 | Collection/Relay/Hub fiabilisés ; paiement, notifications et offline restent incomplets. |
| Fiabilité | 45 | 61 | 182 tests verts, cinq builds verts, faux succès supprimés, SQL distant corrigé. |
| Résilience | 32 | 43 | Procédure DR et vérificateur ajoutés ; aucune restauration isolée exécutée. |
| Scalabilité | 37 | 45 | Test synthétique contrôlé réussi ; aucun test de concurrence métier ou DB à l’échelle. |
| Déploiement | 70 | 74 | Cinq builds indépendants réussis ; cohérence Vercel et redéploiement de cette révision à confirmer. |
| Maintenabilité | 62 | 68 | Garde-fous anti-fixtures, runbooks et scripts reproductibles. |
| Observabilité | 28 | 52 | Checks fiables, moniteur planifié et incident automatique ; APM et astreinte non prouvés. |
| Documentation | 76 | 84 | Runbooks observabilité/DR et présent rapport ajoutés. |

**Note globale : 64/100** (ancienne note : **56/100**).

## Preuves de validation de cette révision

| Contrôle | Résultat |
|---|---|
| Lint monorepo | Réussi, aucun avertissement |
| TypeScript strict | Réussi |
| Tests unitaires/intégration | 37 fichiers, **182/182 réussis** |
| Build racine | Réussi |
| Builds indépendants | User, Hub, Relay, Collection et Admin réussis |
| E2E Collection anti-simulation | **3/3 réussis** : desktop, mobile, tablette |
| E2E Relay anti-faux succès | **3/3 réussis** : desktop, mobile, tablette |
| Audit schéma Supabase distant | Aucune erreur après les migrations correctives |
| Audit sécurité Supabase automatisé | Fonctions, politiques et RLS attendues présentes dans le périmètre contrôlé |
| Comptes pilotes | 32 sessions vérifiées, 28 comptes livrables, 32 e-mails vérifiés, 5 MFA AAL2 ; auto-élévation refusée |
| Health checks de production | 5/5 disponibles lors de la mesure, entre 1,35 s et 2,34 s |
| Injection d’incident synthétique | Échec 503 détecté, processus terminé avec code 1 |
| Charge synthétique santé | 250 requêtes, concurrence 10, 0 erreur ; p95 de 1,08 s à 1,88 s selon l’application |

Limite importante : les E2E ci-dessus ciblent les régressions Collection/Relay corrigées. La suite E2E racine exhaustive n’a pas produit de verdict global dans sa fenêtre de dix minutes. Aucun paiement réel, upload malveillant réellement scanné, restauration isolée ni workflow complet sous charge n’a été validé.

## Registre actualisé des anomalies

| ID | Gravité | Cause et impact | Correction réalisée | Test de validation | Statut |
|---|---|---|---|---|---|
| GRA-001 | Critique | Collection servait un état fixe à une session réelle. | Chargeur Supabase séparé, validation Zod, contrôle de l’utilisateur authentifié, états live/unavailable et absence de fallback fixture en production. | Tests source, TS, build Collection, E2E fail-closed 3 viewports. | **Corrigé dans le code ; recette live post-déploiement requise** |
| GRA-002 | Critique | Aucun fournisseur de paiement réel configuré ; encaissement, webhook et rapprochement indisponibles. | L’API reste volontairement en échec fermé plutôt que de simuler un paiement. | 503 de production attendu sans fournisseur. | **Ouvert — bloque le lancement** |
| GRA-003 | Critique | Reversements, notifications multicanales et fournisseurs externes incomplets. | KYC interne transactionnel renforcé ; aucune fausse intégration externe ajoutée. | Tests KYC 4/4 ; aucune recette fournisseur possible. | **Ouvert — bloque le lancement** |
| GRA-004 | Critique | Aucune restauration complète déjà exécutée. | Runbook DR, RPO provisoire 24 h, RTO provisoire 4 h et script de comparaison sur cible distincte. Le script refuse source=cible. | Revue du script ; pas de cible de restauration disponible. | **Ouvert — exercice réel obligatoire** |
| GRA-005 | Élevée | Collection annonçait un scan validé après un échec et utilisait un compteur local. | Succès uniquement si `synchronized: true`; mutation désactivée hors état live ; faux événements photo/signature supprimés. | Tests sécurité Collection et E2E desktop/mobile/tablette. | **Corrigé** |
| GRA-006 | Élevée | Cache de pages authentifiées sur appareil partagé. | Workers/caches sensibles désactivés ; aucune promesse de mode offline non livré. | Tests middleware et inspection source. | **Corrigé pour la confidentialité ; offline réel ouvert** |
| GRA-007 | Élevée | GPS simulé et non persisté, départ Dakar fixe. | Géolocalisation navigateur, validation session/route et RPC `record_collection_gps`; départ fixe retiré. | Tests sécurité/optimiseur, TS et build. | **Partiel — anti-spoofing, cartes, geofencing et offline ouverts** |
| GRA-008 | Élevée | Modules Collection/Relay affichaient KPI, délais ou actions génériques inventés. | Données réelles ou états vides ; SLA absent affiché « — » ; bouton photo fictif supprimé ; Relay exige confirmation serveur. | Tests anti-fixtures, 182 tests, E2E ciblés. | **Corrigé sur le périmètre détecté ; recette métier exhaustive requise** |
| GRA-009 | Élevée | Rate limiting local aux instances serverless. | Mémoire locale bornée, mais aucun store distribué ajouté sans infrastructure autorisée. | Tests sécurité existants. | **Ouvert — limiteur distribué requis** |
| GRA-010 | Élevée | Uploads utilisables sans scan de contenu. | Registre `secure_uploads`, quarantaine, états de scan, taille/type vérifiés et fichier consommable une seule fois ; KYC refuse tout fichier non `clean`. | Tests KYC 4/4 et lint SQL distant. | **Partiel — moteur antimalware réel absent, bloque le KYC production** |
| GRA-011 | Élevée | Health checks optimistes, absence d’alerte et de runbook. | Checks fail-closed, probe 5 minutes, artefacts 30 jours, incident GitHub automatique, corrélation et runbook. | 5/5 checks, incident 503 simulé détecté. | **Partiel — APM, traces distribuées et astreinte reçue non prouvés** |
| GRA-012 | Élevée | Interfaces et règles pays majoritairement françaises. | Aucune correction suffisante dans cette phase. | Aucun nouveau test pays exhaustif. | **Ouvert — bloque l’international** |
| GRA-013 | Élevée | Mentions légales et gouvernance des données insuffisantes par juridiction. | Aucune validation juridique disponible. | Revue conseil juridique non exécutée. | **Ouvert — bloque l’international** |
| GRA-014 | Élevée | Absence de charge sur dispatch, QR, paiement, upload et DB. | Script de charge santé et première mesure contrôlée de 250 requêtes. | 0 erreur ; p95 documenté. | **Partiel — ne prouve pas la capacité nationale** |
| GRA-015 | Élevée | Sessions de démonstration potentiellement activables en production. | Rejet production et endpoints demo indisponibles. | Tests sécurité. | **Corrigé** |
| GRA-016 | Élevée | Redirections `next/returnTo` externes possibles. | Chemins relatifs locaux stricts. | Cas `//evil`, antislash et chemin valide. | **Corrigé** |
| GRA-017 | Moyenne | Health checks trop bavards ou toujours positifs. | Réponses minimales, dépendances réellement évaluées, cache interdit. | Probes locales/production. | **Corrigé** |
| GRA-018 | Moyenne | Erreurs techniques visibles. | Messages professionnels et détails réservés aux logs corrélés. | Tests d’injection et revue source. | **Corrigé sur les routes auditées** |
| GRA-019 | Moyenne | CSP contient encore `unsafe-inline`. | Non modifié pour éviter une rupture Next sans campagne Report-Only. | En-têtes présents, durcissement non validé. | **Ouvert** |
| GRA-020 | Moyenne | Création d’expédition longue et saisies pays/téléphone fragiles. | Non traité dans cette phase prioritaire backend/opérations. | Aucun nouveau test probant. | **Ouvert** |
| GRA-021 | Moyenne | Couverture inégale entre applications. | Tests KYC et sécurité/anti-fixtures ajoutés ; total passé de 171 à 182. | 182/182 verts. | **Partiel — seuils et mutation testing absents** |
| GRA-022 | Moyenne | Racines Vercel non standardisées et dérive possible. | Cinq builds locaux distincts validés. | Builds 5/5. | **Ouvert — configuration distante à homogénéiser et vérifier** |
| GRA-023 | Moyenne | Faux état « caméra prête ». | Saisie honnête conservée tant que caméra matérielle absente. | Revue UI/tests. | **Corrigé ; caméra réelle non livrée** |
| GRA-024 | Moyenne | Pas de campagne WCAG complète. | Navigation responsive ciblée Collection/Relay testée. | E2E 3 viewports par application sur le flux corrigé. | **Ouvert — audit WCAG/NVDA/VoiceOver requis** |
| GRA-025 | Faible | Libellés français dégradés. | Corrections orthographiques maintenues. | Lint/build. | **Corrigé** |
| GRA-026 | Élevée | Deux fonctions SQL distantes contenaient une ambiguïté `transporter_id` et un appel `digest()` non résolu. | Migration corrective qualifiant la colonne et résolvant la fonction cryptographique. | `supabase db lint --linked --level error` sans résultat. | **Corrigé et migré** |
| GRA-027 | Élevée | Le contrôle Relay pouvait nécessiter plusieurs écritures non atomiques et annoncer un succès demo. | RPC atomique `record_relay_package_control`, correction d’enum, succès UI conditionné à `synchronized: true`. | Lint DB, tests Relay 12/12 ciblés, E2E 3/3. | **Corrigé et migré** |

## Problèmes corrigés depuis le 21 juillet

- Suppression des fixtures pour les sessions réelles Collection et des fallbacks live-vers-fixture Hub/Relay.
- Suppression des faux KPI, délais, identités d’agents et preuves photo/signature détectés.
- Persistance GPS Collection avec validation d’affectation.
- Mutations Relay et Collection conditionnées à une confirmation serveur réelle.
- Contrôle qualité Relay atomique et auditable.
- KYC transactionnel : upload enregistré, quarantaine, contrôle de scan, consommation unique et décision Admin auditée.
- Health checks fiables, surveillance synthétique, simulation d’incident et runbook d’exploitation.
- Procédure de reprise et outil de vérification inter-projets.
- Correction des deux erreurs SQL distantes détectées par le linter.
- Vérification réelle des comptes pilotes et du refus d’auto-élévation.

## Problèmes restant bloquants

1. Contractualiser et configurer un fournisseur de paiement/reversement ; valider webhooks signés, idempotence, remboursement et rapprochement.
2. Brancher un moteur antimalware réel sur la quarantaine avant d’autoriser le KYC production.
3. Livrer les notifications multicanales avec files, retries, dead-letter queue, consentement et preuve de remise.
4. Restaurer une sauvegarde dans un projet Supabase isolé, mesurer RPO/RTO et contrôler l’intégrité.
5. Exécuter une charge réaliste sur les workflows critiques et la base, avec p50/p95/p99, erreurs, CPU, mémoire et saturation.
6. Installer APM/traces distribuées, SLO et astreinte ; injecter un incident et prouver la réception humaine.
7. Finaliser traductions, RTL et règles fiscales/douanières ; obtenir la validation juridique pays par pays.
8. Terminer limiter distribué, offline chiffré, cartographie/geofencing, CSP sans `unsafe-inline`, UX expédition et WCAG 2.2 AA.
9. Exécuter la suite E2E complète authentifiée sur les cinq URLs de production après déploiement de cette révision.

## Risques résiduels

- Une indisponibilité d’un fournisseur externe bloque actuellement paiement, KYC ou notifications au lieu d’être compensée par une orchestration asynchrone éprouvée.
- Aucun résultat ne démontre encore la capacité nationale, la reprise après désastre ou le respect juridique international.
- Les tests synthétiques santé ne mesurent ni les écritures concurrentes, ni la contention DB, ni les limites fournisseurs.
- Les contrôles RLS/RBAC automatisés prouvent la présence et certains scénarios, pas toute la matrice rôle × table × action × pays.
- Les changements locaux doivent encore être déployés et retestés sur les cinq URLs durables avant toute décision de lancement.

## Décision

La plateforme peut continuer en **recette interne contrôlée**, avec échec fermé des fonctionnalités externes non configurées. Elle ne doit pas être présentée comme prête au grand public ni comme système logistique national de référence.

Les déclarations « YOBALELMA EST PRÊTE POUR UN LANCEMENT NATIONAL » et « YOBALELMA EST PRÊTE POUR UN LANCEMENT INTERNATIONAL » sont explicitement refusées à ce stade.
