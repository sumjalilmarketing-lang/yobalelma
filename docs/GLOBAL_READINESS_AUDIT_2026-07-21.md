# Audit global de préparation Yobalelma — 21 juillet 2026

## Verdict exécutif

**Yobalelma n’est pas prête pour un lancement national et n’est pas prête pour un lancement international.**

La plateforme dispose d’une base technique réelle : cinq applications séparées, authentification, RBAC, RLS, migrations alignées, workflows Hub avancés, builds reproductibles, en-têtes HTTP robustes et 171 tests automatisés réussis. Toutefois, des fonctions essentielles restent absentes, simulées ou non éprouvées en conditions réelles : paiements et reversements, KYC externe, notifications multicanales, données Collection en production, géolocalisation persistée, mode hors ligne fiable, reprise après sinistre, observabilité, tests de charge et conformité juridique multi-pays.

Note globale actuelle : **56/100**.

## Périmètre et méthode

Applications auditées :

- User App : `https://yobalelma.vercel.app`
- Hub App : `https://yobalelma-hub.vercel.app`
- Relay App : `https://yobalelma-relay.vercel.app`
- Collection App : `https://yobalelma-collection.vercel.app`
- Admin App : `https://yobalelma-admin.vercel.app`

Contrôles effectués : inventaire source, routes et API, authentification anonyme, permissions, RLS distante, migrations, secrets, en-têtes HTTPS, dépendances, UI des connexions, latence distante, bundles, TypeScript strict, lint, tests unitaires/intégration, builds des cinq applications et revue des documents d’exploitation.

Limites de preuve : aucun test de charge national, aucun test de restauration de sauvegarde, aucun test matériel scanner/caméra, aucun test de paiement réel, aucune campagne complète WCAG avec lecteur d’écran, aucun test réseau mobile physique multi-opérateur et aucune homologation juridique pays par pays n’ont été exécutés.

## Résultats de validation

| Contrôle | Résultat |
|---|---:|
| Lint monorepo | Réussi, 0 avertissement |
| TypeScript strict | Réussi |
| Tests automatisés | 171/171 réussis, 36 fichiers |
| Build User App | Réussi |
| Build Hub App | Réussi |
| Build Relay App | Réussi |
| Build Collection App | Réussi |
| Build Admin App | Réussi |
| Validation Supabase | 69 tables et 10 buckets accessibles selon le contrôle prévu |
| Audit RLS automatisé | 0 table contrôlée sans RLS/politique ; présence vérifiée, sémantique exhaustive non garantie |
| Migrations locale/distante | 41/41 alignées |
| Recherche de secrets suivis | Aucun secret détecté |
| Routes métier anonymes | Redirections 307 ou réponses 401 conformes sur les cinq applications |
| En-têtes | HSTS, CSP, X-Frame-Options, Referrer-Policy et Permissions-Policy présents |

## Mesures de performance

### Production HTTPS

Mesures ponctuelles depuis Paris ; elles ne remplacent pas un test distribué.

| Application | Premier accès racine observé | Accès racine chaud observé |
|---|---:|---:|
| User | 0,74 s | 0,48–0,56 s |
| Hub | 2,20 s | 0,65–1,24 s |
| Relay | 1,84 s | 0,66–1,10 s |
| Collection | 2,93 s | 0,77–0,94 s |
| Admin | 3,25 s | 0,57–0,89 s |

Les démarrages à froid Hub, Collection et Admin dépassent la cible recommandée de deux secondes pour un outil opérationnel. Les résultats sont insuffisants pour conclure sur le p95/p99, le CPU ou la mémoire à l’échelle nationale.

### Bundles de production

| Application | JS partagé | Route principale la plus lourde observée |
|---|---:|---:|
| User | 103 kB | création d’expédition : 224 kB |
| Hub | 103 kB | espace Hub : 129 kB |
| Relay | 103 kB | espace Relay : 131 kB |
| Collection | 103 kB | espace Collection : 132 kB |
| Admin | 103 kB | centre de commandement : 155 kB |

Les builds signalent aussi la sérialisation de chaînes Webpack de 106 kB et 253 kB, à optimiser pour accélérer les builds et le cache CI.

## Registre des problèmes

| ID | Gravité | Impact et preuve | Localisation / cause | Solution et correction | Test de validation | Statut |
|---|---|---|---|---|---|---|
| GRA-001 | Critique | Un compte Collection réel reçoit un état entièrement prédéfini : missions, personnes, GPS, véhicule et KPI sont présentés comme réels. | `apps/collection-app/app/collection/[[...segments]]/page.tsx` appelle toujours `getCollectionState()` ; `collection-store.ts` contient les fixtures. | Créer un chargeur Supabase validé par Zod, échouer fermé et afficher de vrais états vides. | Compte réel avec et sans mission ; vérification croisée SQL/UI et isolement conducteur. | **Ouvert, bloque le lancement** |
| GRA-002 | Critique | Le paiement en ligne réel est indisponible ; l’API de production retourne volontairement 503. Aucun encaissement national fiable. | `/api/payments/intents`, fournisseurs sandbox/manuels. | Contractualiser et intégrer les fournisseurs, webhooks signés, idempotence, rapprochement et remboursement. | Paiement, échec, reprise, double webhook, remboursement et rapprochement réels. | **Ouvert, dépendance externe** |
| GRA-003 | Critique | Reversements, KYC externe et notifications e-mail/SMS/WhatsApp ne sont pas opérationnels de bout en bout. | Intégrations externes absentes documentées dans `REMAINING_EXTERNAL_INTEGRATIONS.md`. | Connecteurs réels, files de messages, retries, dead-letter queue, consentements et suivi de livraison. | Tests sandbox fournisseur puis recette réelle contrôlée. | **Ouvert, bloque le lancement** |
| GRA-004 | Critique | Aucune preuve d’un exercice complet de restauration ; risque de perte durable de données. | Sauvegardes gérées mais procédure de restore non exécutée. | Définir RPO/RTO, sauvegarde vérifiée, restauration isolée et exercice trimestriel. | Rapport de restore avec chronométrage et contrôles d’intégrité. | **Ouvert** |
| GRA-005 | Élevée | Collection annonçait qu’un scan échoué était validé et mis en file alors que seul un compteur était stocké. Perte silencieuse possible. | `collection-pages.tsx`, faux mécanisme `localStorage`. | Suppression du faux succès ; une erreur réseau/serveur reste visible et l’action n’est plus déclarée enregistrée. | Test source anti-régression et suite complète. | **Corrigé localement** |
| GRA-006 | Élevée | Relay et Collection mettaient en cache des pages authentifiées entières ; exposition possible sur appareil partagé et données périmées après déconnexion. | `public/sw.js` et enregistrement automatique du service worker. | Désenregistrement des workers et purge des caches applicatifs en attendant une file chiffrée, isolée par compte. | Vérifier absence de worker/cache après ouverture et déconnexion. | **Corrigé localement ; mode hors ligne non livré** |
| GRA-007 | Élevée | Le GPS Collection est simulé dans l’UI et l’API ne persiste rien ; l’optimiseur utilise un départ Dakar fixe et une heuristique sans trafic. | `collection-store.ts`, `optimizer.ts`, `/api/collection/gps`. | Utiliser `record_collection_gps`, route assignée, consentement, fréquence adaptative, fournisseur cartographique et historique sécurisé. | Trajet réel, perte réseau, faux GPS, route étrangère refusée, reprise et géofencing. | **Ouvert** |
| GRA-008 | Élevée | Plusieurs modules Collection affichent des KPI, horaires, distances, alertes et identités fixes. Relay possède aussi des modules génériques et un bouton photo qui ne capture rien. | `collection-pages.tsx` (`moduleCopy`) et `relay-pages.tsx` (`ModulePage`). | Brancher chaque module à une donnée réelle ou afficher un état vide explicite ; supprimer toute métrique fictive. | Inventaire route/bouton/API automatisé + recette métier. | **Ouvert** |
| GRA-009 | Élevée | Le rate limiting est local à chaque instance serverless et perd son état lors des redémarrages ; contournable horizontalement. | `src/lib/security.ts` dans Hub, Relay, Collection et Admin. | Limiteur distribué durable par IP/compte/action, quotas et alertes. La croissance mémoire locale a été bornée. | Charge multi-instance et test de contournement. | **Partiellement corrigé** |
| GRA-010 | Élevée | Aucun antivirus/antimalware ni inspection de contenu pour les uploads KYC, colis et preuves. | Route d’upload signée et stockage. | Quarantaine, scan asynchrone, type réel par signature, rejet et audit. | EICAR, polyglotte, double extension, fichier volumineux. | **Ouvert** |
| GRA-011 | Élevée | Observabilité insuffisante : pas de traces distribuées, alertes SLO, agrégation d’erreurs ni permanence démontrée. | Logs structurés locaux et pages santé uniquement. | OpenTelemetry/APM, corrélation, tableaux SLI/SLO, alertes et astreinte. | Incident injecté, alerte reçue, diagnostic et post-mortem. | **Ouvert** |
| GRA-012 | Élevée | Internationalisation surtout cosmétique : formats et direction RTL existent, mais Relay, Collection et Admin restent majoritairement en français ; aucune validation légale/douanière pays par pays. | Chaînes codées en dur ; traduction partielle Hub seulement. | Catalogue de messages complet, traduction professionnelle, pseudo-localisation, RTL, règles fiscales/douanières locales. | Matrice pays/langue/devise/fuseau/RTL sur appareils réels. | **Ouvert** |
| GRA-013 | Élevée | Les pages légales sont de courts textes génériques sans identité juridique, base légale, durées, DPO, droits, sous-traitants ni politique cookies. | `apps/user-app/app/privacy/page.tsx`, `terms/page.tsx`. | Validation juridique et documents versionnés par juridiction ; registre de consentement. | Revue conseil juridique et test d’exercice des droits. | **Ouvert, bloque l’international** |
| GRA-014 | Élevée | Aucune preuve de charge 100k, de p95/p99 ni de concurrence nationale sur dispatch, QR, paiement et upload. | Tests de charge limités ou non exécutés sur production. | Plan capacitaire, environnement de charge, seuils d’arrêt et profils réalistes. | Rapports p50/p95/p99, erreurs, CPU, mémoire et saturation DB. | **Ouvert** |
| GRA-015 | Élevée | Des sessions HMAC de démonstration pouvaient être acceptées en production si une variable les activait ; les endpoints démo pouvaient alors créer un accès. | Hub, Relay et Collection `session-token.ts` et routes démo. | Rejet inconditionnel des sessions personnalisées en production et endpoints démo 404. | Tests production sur token valide et altéré. | **Corrigé localement** |
| GRA-016 | Élevée | Des paramètres `next`/`returnTo` acceptaient `//domaine` ou des antislashs, créant un risque de redirection externe après connexion. | Auth Hub, Relay, Collection et Admin. | Validation stricte de chemin relatif local. | Tests `//evil`, `/\\evil` et chemin valide. | **Corrigé localement** |
| GRA-017 | Moyenne | Les endpoints santé divulguaient routes, état des dépendances et métriques opérationnelles. | `/api/health` des cinq applications. | Réponse réduite à `ok` ou `degraded`, cache interdit. | Contrôle du corps et des en-têtes. | **Corrigé localement** |
| GRA-018 | Moyenne | Certaines erreurs brutes de fournisseur/base pouvaient être affichées aux opérateurs. | Auth Hub et mouvements Collection. | Messages professionnels génériques ; détails uniquement dans les logs corrélés. | Injection d’erreurs et absence de noms techniques côté UI. | **Corrigé localement** |
| GRA-019 | Moyenne | Le CSP autorise encore `unsafe-inline` pour les scripts et styles. | En-tête commun des cinq déploiements. | Nonces/hashes compatibles Next, suppression progressive de `unsafe-inline`. | Test CSP Report-Only puis blocage sans régression. | **Ouvert** |
| GRA-020 | Moyenne | User App : création d’expédition longue, pays/téléphones en texte libre et mention interne « centimes ». Risque d’erreurs et abandon mobile. | `/client/shipments/new`. | Étapes réelles, sélecteurs pays/téléphone, unités monétaires lisibles et sauvegarde de brouillon. | Tests mobile, clavier, reprise, erreurs et soumission. | **Ouvert** |
| GRA-021 | Moyenne | Couverture de tests très inégale : User 18 fichiers, Hub 41, Relay 5, Collection 5, Admin 4. | Répertoires `tests/`. | Ajouter contrats API, composants, accessibilité et parcours négatifs par rôle. | Seuils de couverture et mutation testing ciblé. | **Ouvert** |
| GRA-022 | Moyenne | Racines Vercel incohérentes : User/Admin utilisent leur dossier d’app, Hub/Collection utilisent la racine, Relay est dédié. Risque de dérive de build. | Configuration Vercel des cinq projets. | Standardiser cinq projets isolés avec root directory explicite et dépendances de monorepo documentées. | Comparaison locale/Vercel et garde-fou CI. | **Ouvert** |
| GRA-023 | Moyenne | Les états « caméra prête » étaient affichés sans intégration caméra. | Scanner Relay et Collection. | Remplacement par une saisie de référence honnête ; intégration caméra reste à livrer. | Inspection UI et test saisie. | **Corrigé localement** |
| GRA-024 | Moyenne | Les contrôles de connexion accessibles sont bons sur desktop, mais aucune campagne WCAG 2.2 AA complète, lecteur d’écran et navigation clavier sur toutes les pages n’est disponible. | Cinq applications. | Axe + tests manuels NVDA/VoiceOver, zoom 200/400 %, contraste et focus. | Rapport WCAG par route critique. | **Ouvert** |
| GRA-025 | Faible | Les libellés visibles « Role », « Protege », « Controle » et autres accents manquants dégradaient la qualité User App. | Visuel de connexion et formulaires. | Corrections orthographiques françaises. | Lint, build et inspection de la connexion. | **Corrigé localement** |

## Réponses obligatoires

| Question | Réponse objective |
|---|---|
| L’application peut-elle supporter un lancement national ? | **Non.** Paiements, notifications, KYC, Collection live, reprise et charge bloquent. |
| Peut-elle supporter un lancement international ? | **Non.** Les blocages nationaux restent présents, auxquels s’ajoutent langue, conformité, devise et règles pays. |
| Existe-t-il encore des bugs ? | **Oui.** Voir notamment GRA-001, GRA-007, GRA-008 et GRA-020. |
| Existe-t-il des erreurs silencieuses ? | **Oui, risque résiduel.** Le faux succès Collection a été corrigé ; les `catch` silencieux et l’absence d’APM empêchent encore une preuve exhaustive. |
| Existe-t-il des ralentissements ? | **Oui.** Démarrages à froid jusqu’à 3,25 s et bundles jusqu’à 224 kB. |
| Existe-t-il des workflows incomplets ? | **Oui.** Paiement, KYC, notifications, offline, GPS, modules Relay/Collection. |
| Existe-t-il des boutons non connectés ? | **Oui.** Plusieurs actions génériques Relay/Collection n’exécutent pas un workflow métier complet. |
| Existe-t-il des pages incomplètes ? | **Oui.** Modules génériques et pages légales notamment. |
| Existe-t-il des données simulées présentées comme réelles ? | **Oui, critique.** Collection App utilise ses fixtures pour les sessions réelles. |
| Existe-t-il des problèmes de sécurité ? | **Oui.** Plusieurs ont été corrigés ; restent limiter distribué, uploads, CSP et observabilité. |
| Existe-t-il des permissions incorrectes ? | Aucune élévation confirmée dans les tests ; la présence des politiques RLS est validée, mais une preuve sémantique exhaustive rôle/table/action reste à produire. |
| Existe-t-il des problèmes de performance ? | **Oui.** Cold starts, route User lourde et absence de budgets p95/p99. |
| Existe-t-il des problèmes de montée en charge ? | **Oui.** Aucune preuve nationale, limiteur local et tests de concurrence incomplets. |
| Existe-t-il des risques de perte de données ? | **Oui.** Restore non éprouvé ; faux offline corrigé mais vraie synchronisation absente. |
| Existe-t-il des problèmes UX ? | **Oui.** Formulaire d’expédition, faux modules, scan manuel et états trompeurs corrigés partiellement. |
| Existe-t-il des problèmes sur mobile ? | **Risque non levé.** Quelques tests passent, mais aucun parc réel multi-appareil/multi-réseau. |
| Existe-t-il des problèmes d’accessibilité ? | **Risque non levé.** Connexions structurées correctement ; audit WCAG global absent. |
| Existe-t-il des problèmes de responsive ? | **Risque résiduel.** Connexions sans débordement desktop ; tableaux et routes métier non validés exhaustivement. |
| Existe-t-il des problèmes d’internationalisation ? | **Oui.** Traductions et règles locales incomplètes. |
| Existe-t-il des problèmes de géolocalisation ? | **Oui.** GPS non persisté et optimisation simulée. |
| Existe-t-il des problèmes de synchronisation ? | **Oui.** Mode hors ligne réel non livré ; cache sensible désactivé. |
| Existe-t-il des dépendances critiques ? | **Oui.** Fournisseurs paiement/KYC/notifications/cartographie et Supabase/Vercel. Le lock utilise Next 15.5.20, au-dessus des correctifs Next 15.5.18 publiés en mai 2026. |
| Existe-t-il des risques opérationnels ? | **Oui.** Astreinte, alertes, runbooks, reprise et charge non éprouvés. |
| Existe-t-il des problèmes de conformité ? | **Oui.** Documentation légale et politiques de conservation insuffisantes. |

## Notes de préparation

| Domaine | Note /100 | Justification courte |
|---|---:|---|
| Architecture | 66 | Séparation des apps et schéma riche, mais intégrations et données Collection incomplètes. |
| Sécurité | 72 | Bonne base RLS/RBAC/en-têtes ; correctifs locaux importants, risques uploads/CSP/rate limit. |
| Performance | 68 | Bundles raisonnables hors formulaire User ; cold starts et p95 non maîtrisés. |
| UX | 58 | Parcours principaux présents, plusieurs modules trompeurs ou génériques. |
| UI | 76 | Design cohérent et lisible ; finitions et densité variables. |
| Accessibilité | 65 | Structure correcte sur connexions ; validation WCAG globale absente. |
| Internationalisation | 44 | Formats/RTL de base, traductions et conformité pays incomplètes. |
| Workflow métier | 49 | Hub avancé, mais paiement, Collection et intégrations externes bloquants. |
| Fiabilité | 45 | Tests verts, mais données simulées, restore et services externes non éprouvés. |
| Résilience | 32 | Offline désactivé pour sécurité, pas de DR drill ni files externes robustes. |
| Scalabilité | 37 | Aucune preuve de charge nationale et rate limiting local. |
| Déploiement | 70 | Cinq HTTPS actifs, builds verts ; racines de projets incohérentes. |
| Maintenabilité | 62 | TS strict et documentation riche ; gros fichiers monolithiques et tests inégaux. |
| Observabilité | 28 | Logs et santé de base, sans APM/SLO/alerting démontré. |
| Documentation | 76 | Documentation abondante et honnête, mais certains rapports historiques se contredisent. |

**Note globale : 56/100.**

## Ordre de levée des blocages

1. Remplacer toutes les données Collection simulées par des lectures/écritures Supabase réelles et terminer GPS/offline.
2. Intégrer paiements, webhooks, reversements, remboursements et rapprochements réels.
3. Intégrer KYC et notifications externes avec files, retries et consentements.
4. Installer observabilité, SLO, alertes et permanence ; exécuter un exercice de restauration.
5. Réaliser charge/concurrence, tests matériels et tests mobiles réseau lent.
6. Terminer traductions, RTL, devises, fuseaux et conformité juridique pays par pays.
7. Exécuter une campagne WCAG 2.2 AA et une recette rôle par rôle sur les cinq URLs de production.

## Décision

Les mentions de préparation nationale ou internationale sont volontairement refusées. La plateforme est adaptée à une **recette interne et à un pilote contrôlé avec données de test**, sous surveillance et sans paiement réel. Elle ne doit pas encore être ouverte au grand public ni utilisée comme système logistique national de référence.
