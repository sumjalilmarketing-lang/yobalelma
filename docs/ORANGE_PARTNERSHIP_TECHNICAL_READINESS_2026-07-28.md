# Préparation technique du partenariat Orange — rendez-vous du 28 juillet 2026

Date de contrôle : 22 juillet 2026  
Branche auditée : `codex/hub-enterprise-upgrade`  
Révision de référence déjà publiée : `7eb31f7` (`feat(payments): prepare locked Orange Money integration`)  
État du présent complément : modifications locales non encore déployées au moment de ce rapport.

## Verdict exécutif

**YOBALELMA NON PRÊTE — BLOQUANTS INTERNES RESTANTS**

Yobalelma est démontrable et son architecture prépare correctement l’intégration Orange sans inventer d’API, de clé, de transaction ou de point relais. Elle ne peut toutefois pas être présentée comme « prête hors Orange » : une restauration complète sur cible isolée, la charge des workflows métier, l’APM avec astreinte humaine, l’antimalware KYC, les notifications externes, la recette authentifiée de la révision courante et plusieurs validations internationales ne disposent pas encore de preuves suffisantes.

Note précédente : **64/100**.  
Note actuelle prudente : **68/100**. La progression repose sur les migrations appliquées, les files externes sécurisées, la correction ACL constatée par audit distant et la recette locale verte. Elle ne vaut pas activation des fournisseurs ni validation d’exploitation.

## 1. Architecture Yobalelma

Le monorepo contient cinq applications Next.js distinctes : User, Hub, Relay, Collection et Admin. Elles partagent les briques d’authentification, de sécurité, de validation, de paiement, de notifications, d’internationalisation et de présentation. La donnée opérationnelle est portée exclusivement par le projet Yobalelma `rgcgtcycbiuhcaoaadbh`.

Les frontières de sécurité distinguent :

- zone publique : inscription, connexion et suivi public limité ;
- zone client : profil, expéditions, paiements et documents ;
- zone opérationnelle : Hub, Relay et Collection ;
- zone administrative : opérations, finance, conformité et support ;
- zone haute sensibilité : rôles, sécurité, KYC, remboursements, reversements et audit.

Les changements de statut critiques sont réalisés côté serveur ou par RPC contrôlée. Les adaptateurs externes échouent de façon fermée quand leur fournisseur n’est pas configuré.

## 2. Applications et URLs documentées

| Application | URL durable documentée | État de la preuve |
|---|---|---|
| User App | `https://yobalelma-user.vercel.app` | Déploiement existant ; révision locale courante non redéployée et non revalidée en ligne. |
| Hub App | `https://yobalelma-hub.vercel.app` | Déploiement existant ; révision locale courante non redéployée et non revalidée en ligne. |
| Relay App | `https://yobalelma-relay.vercel.app` | Déploiement existant ; révision locale courante non redéployée et non revalidée en ligne. |
| Collection App | `https://yobalelma-collection.vercel.app` | Déploiement existant ; révision locale courante non redéployée et non revalidée en ligne. |
| Admin App | `https://yobalelma-admin.vercel.app` | Déploiement existant ; nouvel écran Orange non encore déployé. |

La politique de contrôle du navigateur a refusé l’ouverture des domaines Vercel pendant cette passe. Aucun résultat de disponibilité postérieur ne sera donc inventé. La mesure précédente du 22 juillet portait sur 5/5 health checks disponibles, mais ne valide pas le code local actuel.

## 3. Workflows métier

### Couverture existante

- User : authentification, profils, expéditions, suivi, QR/OTP, notifications internes, support et parcours de paiement verrouillé.
- Hub : réception, contrôle, inspection, stockage, lots, capacité, incidents et remises auditables.
- Relay : réception, contrôle atomique, stockage, remise transporteur et remise destinataire protégée par OTP.
- Collection : missions live, véhicule, parcours, scan, GPS persistant et contrôle d’affectation.
- Admin : gouvernance par directions, missions, workflows, audit, finance, paiements et reversements.

### Limites non levées

- aucun parcours national et international complet n’a été rejoué sous charge sur la révision courante ;
- le mode hors connexion Collection n’est pas une preuve de synchronisation chiffrée et conflictuelle à grande échelle ;
- le GPS réel, l’anti-spoofing, le geofencing et la recette sur terminaux physiques restent incomplets ;
- les scénarios fournisseurs externes ne peuvent pas être validés avant contractualisation.

## 4. Données simulées

La recherche de `mock`, `fake`, `demo`, `fixture`, `simulated` et termes associés a retrouvé des fixtures Relay et Collection. Elles sont utilisées par les tests et les sessions de formation locales. Les routes de connexion de formation retournent 404 en production et les jetons de démonstration y sont rejetés. Les chargeurs live utilisent un état `unavailable` en cas d’échec et ne basculent pas silencieusement vers une fixture.

Risque résiduel : conserver ces fixtures dans le même paquet augmente le risque de régression. La règle de rejet production est testée, mais doit rester un contrôle obligatoire en CI.

## 5. Sécurité

### Mesures présentes

- authentification Supabase et contrôles RBAC/ABAC par rôle, service et affectation ;
- RLS sur le périmètre contrôlé ;
- MFA AAL2 vérifiée précédemment pour cinq rôles sensibles ;
- validation Zod, contrôle same-origin, idempotence et limitation de débit locale ;
- QR/OTP vérifiés côté serveur ;
- uploads KYC en quarantaine et consommation conditionnée à l’état `clean` ;
- CSP, HSTS, anti-framing et politiques navigateur ;
- journaux expurgés des secrets, OTP et jetons ;
- refus de l’auto-élévation vérifié lors de la campagne pilotes précédente.

### Risques résiduels

| Risque | Gravité | Impact | Correction requise |
|---|---|---|---|
| Aucun moteur antimalware relié à la quarantaine KYC | Critique | Un document ne peut pas être déclaré sûr en production. | Connecter un moteur, valider les signatures/types réels, tester EICAR et reprise. |
| Limiteur non distribué entre instances serverless | Élevée | Contournement possible par répartition des requêtes. | Store partagé atomique, quotas par identité/IP/opération et alertes. |
| CSP contient encore `unsafe-inline` | Moyenne | Surface XSS plus large. | Déployer Report-Only, corriger les violations puis passer aux nonces/hashes. |
| Matrice RLS rôle × ressource × pays non exhaustive | Élevée | Risque d’accès transversal non détecté. | Générer et exécuter toute la matrice sur une cible de recette. |
| Revue offensive indépendante absente | Élevée | Vulnérabilités résiduelles inconnues. | Pentest externe avant ouverture publique. |

## 6. Performance et volumes démontrés

La dernière charge non destructive documentée a envoyé 250 requêtes vers les health checks, concurrence 10, sans erreur, avec p95 compris entre 1,08 s et 1,88 s selon l’application. Ce test vérifie la disponibilité synthétique, pas la capacité métier.

Les builds des cinq applications avaient réussi lors de l’audit du 22 juillet. La révision `7eb31f7` a ensuite validé les builds racine, User et Admin. Aucun chiffre actuel ne prouve 100, 500, 1 000 ou 5 000 utilisateurs créant, scannant, géolocalisant et mettant à jour des colis simultanément.

Conclusion capacité : **volume national non démontré**. Il est interdit de transformer les 250 probes de santé en estimation d’utilisateurs supportés.

## 7. Observabilité

Disponible : health checks fail-closed, identifiants de corrélation, moniteur synthétique cinq minutes, artefacts 30 jours, incident GitHub automatique et runbook.

Non prouvé : APM, traces distribuées de bout en bout, métriques CPU/mémoire/DB, SLO métiers, routage vers une astreinte et accusé de réception humain. L’observabilité reste donc un blocage interne de production.

## 8. Sauvegarde et reprise

Le runbook définit une cible isolée, RPO cible de 24 h et RTO cible de 4 h. Le validateur refuse que source et cible soient identiques et compare les volumes de tables critiques sans lire leur contenu.

**Aucune restauration complète n’a été exécutée sur une cible isolée.** Les objectifs RPO/RTO ne sont pas des résultats acquis. Le test exige un projet de reprise distinct, une sauvegarde restaurable, le contrôle Storage/Auth/RLS, un chronométrage et une validation fonctionnelle signée.

## 9. Accessibilité, design et internationalisation

Le Design System commun prévoit contrastes, focus visible, responsive, thèmes, réduction des mouvements et états de formulaire. Des E2E ciblés desktop/mobile/tablette ont été réalisés auparavant pour Relay et Collection.

Restent sans preuve exhaustive : WCAG 2.2 AA sur toutes les routes, NVDA/VoiceOver, zoom 200/400 %, RTL complet, écran 4K, terminaux physiques moyens de gamme et formulaires internationaux complets. Les règles légales, douanières, fiscales et de conservation doivent être validées pays par pays.

## 10. Notifications

Le canal interne est raccordé. Email, SMS et WhatsApp sont explicitement marqués `sandbox` et ne sont pas présentés comme livrés. L’abstraction existe mais l’orchestration production (file, retry, DLQ, consentement, langue, fuseau, preuve de remise et fournisseur officiel) reste incomplète.

## 11. Comptes pilotes

La campagne précédente a vérifié 32 sessions, 28 comptes livrables, 32 emails vérifiés et 5 MFA AAL2. Aucun mot de passe n’est stocké ou affiché dans le dépôt. La récupération doit passer par l’invitation ou la réinitialisation sécurisée Supabase.

La révision actuelle n’a pas été rejouée rôle par rôle sur les cinq URLs. Ces comptes ne sont donc pas déclarés revalidés pour ce rapport.

## 12. Orange Money préparé

La couche `PaymentProvider` couvre création, statut, confirmation, annulation, remboursement, webhook, rapprochement et reversement conditionnel. Elle impose validation serveur du montant/devise/propriétaire, idempotence, anti-rejeu, signature/authenticité du webhook et statut final confirmé côté serveur.

L’adaptateur Orange ne construit aucun endpoint ou en-tête supposé : transport, mapping et contrat doivent provenir de la documentation officielle. L’adaptateur de test reste impossible à utiliser comme fournisseur réel en production. Les tables paiements, événements, remboursements, reversements et grand livre sont créées par la migration déjà appliquée `20260722020000_orange_money_payment_foundation.sql`.

Statut : **PRÊT TECHNIQUEMENT — ACCÈS ORANGE REQUIS**.

## 13. Points Relais Orange préparés

La fondation ajoutée dans cette passe comprend :

- interface `RelayLocationProvider` indépendante du partenaire ;
- adaptateur `OrangeRelayProvider` verrouillé sans transport et mapping officiels ;
- validation stricte des identifiants, adresses, pays, coordonnées, horaires, services, capacité, disponibilité et statut ;
- pagination bornée et détection des boucles de curseur ;
- hash de source pour identifier les changements ;
- persistance traçable des imports, mises à jour, rejets et désactivations ;
- désactivation des absents uniquement lors d’un snapshot complet non vide ;
- protection SQL des champs partenaire contre les rôles opérationnels ordinaires ;
- écran Admin `Intégrations · Orange` réservé aux rôles partenaires, administrateurs et auditeurs ;
- variables vides, sans fausses valeurs : `ORANGE_RELAY_BASE_URL`, `ORANGE_RELAY_CLIENT_ID`, `ORANGE_RELAY_CLIENT_SECRET`.

La migration `20260722030000_orange_relay_integration_foundation.sql` est appliquée au projet Yobalelma. Le schéma distant valide 76 tables et 10 buckets sans échec. L’accès Orange et la recette avec les données officielles restent requis.

Statut : **PRÊT DANS LE CODE — MIGRATION ET ACCÈS ORANGE REQUIS**.

## 14. Données et APIs nécessaires d’Orange

### Orange Money

- offre et pays contractualisés ;
- documentation exacte sandbox/production ;
- base URL et versions ;
- client/merchant identifiers et secrets ;
- protocole d’authentification ;
- règles d’idempotence et anti-rejeu ;
- format/signature des webhooks ;
- états, codes d’erreur et délais ;
- remboursement et reversement réellement inclus ou non ;
- devises, limites, commissions et règles de rapprochement ;
- URLs à autoriser et procédure de recette/certification.

### Points relais

- endpoint ou mécanisme de transfert officiel ;
- authentification, pagination, quotas et SLA ;
- schéma, dictionnaire des champs et identifiants stables ;
- mode snapshot/delta et règle de suppression ;
- nom, adresse, coordonnées, horaires, services, capacité, disponibilité et statut ;
- pays couverts, fréquence de mise à jour et source de vérité ;
- procédure de rapprochement avec un relais Yobalelma existant ;
- environnement de test et jeu de données contractuellement autorisé.

## 15. Procédure de recette conjointe

1. Valider contrats, pays, capacités et responsabilités des données.
2. Remettre les secrets via un coffre approuvé, jamais par Git ou rapport.
3. Compléter les mappings depuis la documentation exacte.
4. Appliquer les migrations sur une cible de recette isolée.
5. Importer un petit lot de relais et contrôler chaque champ avec Orange.
6. Tester snapshot, delta, doublon, suppression, pagination, timeout et reprise.
7. Exécuter les paiements refusé, expiré, retardé, dupliqué, remboursé et rapproché.
8. Tester webhooks authentifiés, invalides, rejoués et hors ordre.
9. Réaliser la matrice permissions et le journal d’audit.
10. Effectuer une charge conjointe respectant les quotas Orange.
11. Signer les résultats, effectuer un déploiement progressif puis surveiller les SLO.

## 16. Calendrier indicatif après accord

Ce calendrier commence seulement après réception d’une documentation complète et d’un sandbox fonctionnel :

- J0–J2 : revue contractuelle/technique, coffre, mapping et allowlists ;
- J3–J5 : connexion sandbox, import relais initial et tests composants ;
- J6–J8 : E2E, sécurité, erreurs, rapprochement et charge contrôlée ;
- J9–J10 : recette conjointe, corrections et validation ;
- J11–J14 : production progressive, surveillance renforcée et décision de généralisation.

Il s’agit d’une estimation, pas d’un engagement contractuel.

## 17. Validation exécutée le 22 juillet 2026

| Contrôle | Environnement | Résultat | Limite |
|---|---|---|---|
| Tests ciblés six blocages/Orange/KYC | local | **40 fichiers, 209 tests réussis** | Inclut verrous fournisseurs, redaction, charge, DR et ACL source. |
| Tests Orange Relais | local | verrou fournisseur, normalisation, coordonnées invalides et boucle de pagination couverts | Migration distante non couverte. |
| `pnpm run typecheck` | local sandbox | non conclu — résolution du junction `@types/qrcode` refusée | Ce résultat ne démontre ni erreur ni succès du code. |
| ESLint direct | local sandbox | non conclu — accès au paquet ESLint refusé (`EPERM`) | Relance hors sandbox refusée. |
| Migrations management | local → Supabase Yobalelma | `20260722030000`, `20260722040000` et `20260722041000` appliquées | Aucune fausse donnée fournisseur injectée. |
| TypeScript strict | local | Réussi | Arbre courant. |
| ESLint | local | Réussi, aucun avertissement | Arbre courant. |
| Build racine | local production | Réussi | 77 pages générées. |
| Build Admin | local production | Réussi | 16 pages générées. |
| Validation Supabase | distant | 76 tables, 10 buckets, aucun échec | Projet Yobalelma exclusivement. |
| Audit sécurité Supabase | distant | RLS/politiques/RPC verts ; workers service-role uniquement | Défaut ACL détecté puis corrigé par `20260722041000`. |
| Audit navigateur URLs Vercel | navigateur intégré | non exécuté — ouverture refusée par la politique du navigateur | Disponibilité courante non revalidée. |
| Restauration | cible isolée | non exécutée | Bloquant production. |
| Charge métier | staging jetable | non exécutée | Bloquant capacité nationale. |

L’arbre local courant dispose désormais de lint, TypeScript, 209 tests et builds racine/Admin réussis. La publication et la recette authentifiée Vercel restent à effectuer.

## 18. Séparation des dépendances

### A. Blocages internes à traiter

1. publier la révision validée sans inclure les changements utilisateur non liés ;
2. redéployer uniquement les projets affectés puis exécuter les E2E authentifiés ;
4. connecter l’antimalware KYC ;
5. livrer rate limiting distribué et orchestration multicanale ;
6. mettre en service APM/traces/astreinte et prouver la réception d’une alerte ;
7. restaurer réellement une sauvegarde sur cible isolée et mesurer RPO/RTO ;
8. exécuter la charge métier progressive jusqu’au seuil autorisé ;
9. terminer la matrice RLS/ABAC, WCAG et terminaux physiques ;
10. obtenir les validations légales par pays.

### B. Dépendances externes Orange

- contrats, pays et conditions commerciales ;
- documentation et endpoints officiels ;
- clés sandbox/production ;
- capacités remboursement/reversement ;
- format et signature webhook ;
- quotas, SLA et certification ;
- liste officielle des points relais et contrat de synchronisation.

## Conclusion

L’équipe peut démontrer l’architecture, le verrouillage des intégrations non configurées, l’espace Finance, le modèle Orange Money et la nouvelle fondation Points Relais Orange. Elle doit présenter clairement à Orange que ces interfaces sont préparées mais non opérationnelles.

Le verdict 1 est refusé parce que les dépendances internes ne sont pas toutes validées. Le verdict 2 est également prématuré tant que restauration, antimalware, observabilité humaine et recette finale ne sont pas prouvés.

**VERDICT : YOBALELMA NON PRÊTE — BLOQUANTS INTERNES RESTANTS**

## Mise à jour ciblée — six blocages

La passe ciblée du 22 juillet complète sans nouveau développement fonctionnel : file antimalware KYC louée et auditable, contrats APM/astreinte avec redaction, file notifications avec retry/dead-letter, harnais de charge refusant la production et validation DR élargie. Le détail et les conditions d’activation figurent dans `SIX_BLOCKERS_RESOLUTION_2026-07-22.md`.

Ces travaux réduisent le code restant, mais ne constituent pas une preuve d’exploitation : scanner, APM, astreinte, fournisseurs de notification, staging de charge et cible DR ne sont pas activés. La migration `20260722040000_external_readiness_queues.sql` est appliquée et auditée ; la recette locale est verte, mais la recette authentifiée Vercel attend la publication.

**VERDICT MAINTENU : YOBALELMA NON PRÊTE — BLOQUANTS INTERNES RESTANTS**
