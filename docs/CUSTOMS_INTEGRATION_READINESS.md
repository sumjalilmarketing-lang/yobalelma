# Préparation de l’intégration douanière Yobalelma

Date de validation : 22 juillet 2026  
Périmètre : fondation multi-pays, mode manuel contrôlé et préparation d’un futur canal officiel Sénégal. Aucun accès, numéro, tarif, code HS ou résultat douanier fictif n’est fourni.

## Verdict

**DOUANE PRÉPARÉE — ACCORDS ET ACCÈS OFFICIELS REQUIS**

Ce verdict signifie que les blocages internes du socle sont levés et testés. Il ne signifie pas que Yobalelma est connecté à la Douane, à GAINDE ou à ORBUS, ni qu’une déclaration, une liquidation ou une mainlevée réelle peut déjà être transmise.

## Résolution par nature

| Élément | Code seul | Dépendance | État vérifié |
|---|---:|---|---|
| Modèle, statuts, historique et files | Oui | Aucune | Installés sur le projet Supabase Yobalelma. |
| RBAC/ABAC et séparation des rôles | Oui | Affectations opérationnelles réelles | RLS actif ; accès pays/dossier/commissionnaire limité. |
| Mode manuel contrôlé | Oui | Preuve et décision officielles obtenues hors plateforme | Double contrôle, preuve scannée, référence et autorité obligatoires. |
| Classification HS et règles pays | Partiellement | Référentiels juridiques validés et responsables désignés | Moteur versionné prêt ; aucune règle légale préchargée. |
| Estimation des droits | Partiellement | Barèmes officiels à jour | Toute estimation Yobalelma est marquée indicative ; montant officiel séparé et immuable. |
| Canal Sénégal / GAINDE / ORBUS | Non | Accord, documentation, sandbox, certificats et identifiants | Adaptateur en échec fermé ; aucune requête officielle n’est inventée. |
| Commissionnaires agréés | Partiellement | Contrats, agréments vérifiés et SLA | Registre, agents, affectation et cloisonnement disponibles. |

## Architecture livrée

`CustomsProvider` isole le métier des fournisseurs. Il expose : création et mise à jour du dossier, soumission, document, demande de pièce, estimation indicative, statut, webhook, inspection, mainlevée, suspension, libération et clôture. Les implémentations prévues sont `SenegalCustomsProvider`, `ManualCustomsProvider`, `BrokerCustomsProvider` et de futurs adaptateurs nationaux.

`SenegalCustomsProvider` exige un transport et un mapping construits à partir de la documentation officielle. Sans eux, il retourne `SENEGAL_CUSTOMS_OFFICIAL_ACCESS_REQUIRED`. Le navigateur ne reçoit jamais les secrets. Les événements officiels, droits officiels, paiements de droits et workers ne sont exécutables que par `service_role`.

La file `customs_outbox` fournit idempotence, lease, `SKIP LOCKED`, reprise exponentielle bornée, compteur de tentatives et dead-letter. Les payloads enregistrés doivent être nettoyés avant appel des RPC.

## Données et workflows

Le schéma comprend : `customs_cases`, `customs_items`, `customs_documents`, `customs_events`, `customs_decisions`, `customs_duties`, `customs_rule_sets`, `customs_hs_suggestions`, `customs_brokers`, `customs_broker_agents`, `customs_offices` et `customs_outbox`.

Le workflow normalise les états de `draft` à `closed`. Une transition sensible doit passer par une fonction contrôlée. `released` exige une décision de mainlevée vérifiée. Une décision officielle, un événement, une liquidation ou un historique HS ne peut pas être supprimé. Après soumission, articles et documents deviennent immuables. Les règles approuvées restent historisées et leur auteur ne peut pas les approuver.

Le parcours préparé couvre : contenu et valeur, proposition HS indicative, contrôle par règles validées, documents sécurisés, revue conformité, commissionnaire éventuel, soumission future, inspection, droits, paiement confirmé côté serveur, mainlevée vérifiée, reprise du transport et archivage.

## Mode manuel contrôlé

Une décision manuelle exige : dossier accessible, type autorisé, référence officielle, autorité, date d’effet et document justificatif préalablement déclaré sain par le scanner puis vérifié par un autre acteur. La décision reste non vérifiée jusqu’à l’approbation d’un second responsable distinct. Une mainlevée ne libère le dossier qu’après ce second contrôle.

Le mode manuel ne génère aucune référence et ne transforme jamais une estimation ou une saisie opérateur en décision officielle.

## Rôles et sécurité

- `customs_agent` et `customs_manager` : opérations dans les pays affectés ;
- `compliance_agent` et `compliance_manager` : revue et validation dans leur périmètre ;
- `customs_broker` et `customs_broker_manager` : uniquement les dossiers attribués à leur organisation ;
- `finance_customs_agent` : lecture et rapprochement des droits ;
- `auditor` : lecture seule ;
- `admin` et `super_admin` : administration contrôlée.

Sont interdits : auto-validation, suppression d’historique, modification directe d’un montant officiel, changement de périmètre du dossier, affectation d’un commissionnaire non actif/non éligible, libération sans décision vérifiée et accès hors pays ou hors dossier attribué.

## Documents

Les documents douaniers référencent `secure_uploads`. Leur vérification exige le statut antimalware `clean` et la correspondance SHA-256. L’architecture existante prend en charge quarantaine, taille/type réel, scan, journalisation et stockage privé. La durée de conservation et la procédure de suppression réglementée doivent être validées par pays avant exploitation.

## Admin App

L’espace `DOUANE ET COMMERCE INTERNATIONAL` expose les 17 rubriques demandées : dossiers, déclarations, documents, marchandises, inspections, droits et taxes, mainlevées, blocages, saisies, commissionnaires, bureaux, règles par pays, codes HS, incidents, audit, intégrations et statistiques. Les tableaux n’utilisent que les données réelles visibles par RLS. L’absence de connexion officielle est affichée sans présenter de résultat simulé.

## Variables à fournir hors Git

```text
CUSTOMS_PROVIDER
CUSTOMS_BASE_URL
CUSTOMS_CLIENT_ID
CUSTOMS_CLIENT_SECRET
CUSTOMS_CERTIFICATE_PATH
CUSTOMS_WEBHOOK_SECRET
CUSTOMS_ORGANIZATION_ID
CUSTOMS_BROKER_ID
CUSTOMS_ENVIRONMENT
```

Les noms devront être adaptés au contrat officiel réel. Aucun fichier `.env` ni secret n’est committé.

## Informations exactes à demander à la Direction générale des Douanes

- procédure d’agrément de Yobalelma et responsabilités légales ;
- périmètre des opérations autorisées et régimes applicables ;
- autorités habilitées à émettre/revérifier une décision et une mainlevée ;
- référentiels officiels : bureaux, codes, statuts, documents, restrictions, prohibitions et durées de conservation ;
- source/version des tarifs, taxes, exemptions, taux et règles de liquidation ;
- procédure de correction, annulation, recours, inspection, saisie et reprise ;
- exigences de signature, certificat, chiffrement, horodatage et archivage probant ;
- exigences de protection des données, localisation, audit, notification d’incident et continuité ;
- environnement de recette, scénarios de certification, critères d’homologation et contacts d’escalade ;
- règles encadrant les commissionnaires agréés et la preuve de leurs licences.

## Informations exactes à demander à GAINDE 2000

- documentation contractuelle et technique à jour, versions et journal de changements ;
- URL et disponibilité des environnements sandbox, homologation et production ;
- mécanisme d’authentification machine à machine, certificats, autorités de certification et rotation ;
- formats, schémas, nomenclatures, encodages, tailles maximales et exemples officiellement fournis ;
- opérations réellement disponibles et limites par environnement ;
- idempotence, identifiants de corrélation, pagination et règles anti-rejeu ;
- signature et authentification des callbacks/webhooks, fenêtres de tolérance et ordre des événements ;
- catalogue officiel des statuts, décisions, erreurs et règles de rapprochement ;
- quotas, rate limits, SLA, timeouts, retry autorisé et procédures d’indisponibilité ;
- règles de dépôt et téléchargement documentaire ;
- IP/DNS à autoriser, exigences réseau, mTLS/VPN éventuels ;
- données de test autorisées, comptes de certification, jeux d’essai et preuve de recette ;
- support, astreinte, escalade, maintenance planifiée et processus de passage en production.

## Tests et preuves

- lint complet du monorepo : réussi sans avertissement ;
- TypeScript strict complet : réussi ;
- 41 fichiers et 218 tests : réussis, dont 9 tests ciblés Douane (échec fermé fournisseur, mainlevée, transport injecté, HS indicatif, règles approuvées/pays/date, droits indicatifs, immutabilité, ACL service et espace Admin) ;
- build de production racine : réussi, 77 pages générées ;
- build de production Admin App : réussi, 16 pages générées et route Douane compilée dans `/command/[[...segments]]` ;
- migrations `20260722050000`, `20260722051000` et `20260722052000` : appliquées transactionnellement ;
- validation Supabase : 88 tables, 10 buckets, aucun échec ;
- audit sécurité : RLS et politiques présents, fonctions attendues présentes, 9 RPC workers/sensibles réservées au `service_role`, aucun ACL dangereux.

## Activation et recette officielle restante

1. signer les accords et recevoir la documentation officielle ;
2. construire le transport et le mapping sans supposer endpoints ou champs ;
3. injecter les secrets dans le coffre de l’environnement, jamais côté client ;
4. charger uniquement des règles et bureaux sourcés puis les faire approuver par deux personnes ;
5. exécuter en sandbox les cas complet, document manquant, interdit/réglementé, HS erroné, inspection, rejet, information complémentaire, droits, paiement, mainlevée, doublon, signature invalide, timeout, panne et reprise ;
6. rapprocher chaque événement avec le portail officiel ;
7. obtenir l’homologation et conserver ses preuves ;
8. activer la production par feature flag et surveillance renforcée.

## Risques résiduels

- aucune documentation ni connectivité officielle n’a été fournie ou testée ;
- aucune règle pays, code HS, bureau, tarif ou commissionnaire n’est juridiquement validé par ce code ;
- le mapping des statuts, erreurs, signatures et événements reste inconnu ;
- les obligations de conservation/localisation et le modèle contractuel doivent être approuvés ;
- la recette de charge, de résilience et d’homologation du fournisseur reste à exécuter dans son environnement.
