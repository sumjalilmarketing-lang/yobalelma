# Résolution ciblée des six blocages internes

Date : 22 juillet 2026  
Périmètre : aucun développement fonctionnel ; uniquement reprise, sécurité KYC, observabilité, charge, notifications et recette.

## Synthèse de dépendance

| Blocage | Résolution par le code seul | Dépendance externe | État après cette passe |
|---|---|---|---|
| Restauration réelle | Non | Infrastructure Supabase isolée, sauvegarde disponible, fenêtre et responsables d’exploitation | Validateur renforcé ; exercice réel toujours requis. |
| Antimalware KYC | Partiellement | Choix/contrat du scanner, moteur ou service, endpoint et secret | Interface, file louée, audit et tests prêts ; activation fournisseur requise. |
| APM et astreinte | Partiellement | Fournisseur APM, destination d’astreinte, SLO et équipe responsable | Contrats d’adaptateurs, redaction et accusés de réception prêts ; fournisseur et décision d’exploitation requis. |
| Charge métier | Non pour la preuve | Staging jetable représentatif, comptes/données de charge, fenêtre et capacité d’observation | Harnais progressif 100/500/1 000/5 000 prêt et production explicitement refusée. |
| Notifications externes | Partiellement | Fournisseurs email/SMS/WhatsApp, consentements, sender IDs, templates approuvés | Adaptateurs, retries, leases et dead-letter prêts ; contrats fournisseurs requis. |
| Recette finale du code | Oui | Déploiement distant uniquement pour la recette production | Recette locale verte ; recette authentifiée Vercel post-déploiement restante. |

## 1. Restauration

Le code peut vérifier une restauration mais ne peut pas créer légitimement une sauvegarde ou une cible sans décision d’exploitation. `verify-disaster-recovery.mjs` refuse désormais : source différente de Yobalelma, cible identique, cible hors Supabase et clés source/cible identiques. Le contrôle inclut paiements, grand livre, notifications, uploads sécurisés, événements de scan et synchronisations partenaires.

Activation : créer un projet Supabase isolé, restaurer Auth/Postgres/Storage, injecter les quatre variables DR hors Git, exécuter le validateur, tester les workflows et signer le RPO/RTO réel.

## 2. Antimalware KYC

Les documents restent en `pending` tant qu’un verdict `clean` n’est pas écrit par le worker de confiance. La migration ajoute une file avec lease, `SKIP LOCKED`, dix tentatives maximum, empreinte SHA-256, version des signatures et journal de verdict sans payload fournisseur brut. Les RPC sont réservées au `service_role`.

L’adaptateur `MalwareScanner` valide entrée et résultat et échoue fermé sans transport contractuel. Il reste à choisir un moteur, documenter son mapping exact, déployer le worker et tester fichier sain, EICAR, timeout, panne et définitions périmées.

## 3. APM et astreinte

Les contrats `ObservabilityProvider` et `OnCallAlertProvider` imposent trace/span IDs, schéma borné, redaction email/JWT/secrets/données de paiement et reçu d’alerte. Aucun fournisseur n’est prétendu actif sans transport configuré.

Activation : choisir APM et outil d’astreinte, définir SLO/destinataires/rétention, adapter leur contrat officiel, injecter endpoint/tokens dans le coffre Vercel, envoyer un incident synthétique et conserver la preuve d’accusé humain.

## 4. Charge métier

`critical-workflow-load.mjs` lit un scénario externe non committé, monte progressivement jusqu’à 5 000 itérations, mesure p50/p95/p99 et taux d’erreur. Il refuse toutes les URLs Vercel Yobalelma, la base Supabase de production, les cibles non déclarées `disposable-staging`, les méthodes non prévues et le HTTP hors localhost.

Activation : cloner une base anonymisée ou synthétique sur staging jetable, fournir les comptes de charge, créer les scénarios métier autorisés, brancher CPU/mémoire/DB/APM puis exécuter par paliers. Arrêt obligatoire si erreur > 1 % ou p95 > 2 s.

## 5. Notifications externes

L’interface commune couvre email, SMS et WhatsApp, avec canal, locale, template, idempotence et reçu fournisseur. La base ajoute lease, tentatives bornées, prochaine reprise, code d’erreur nettoyé et dead-letter. Les claims atomiques sont réservés au service worker.

Activation : sélectionner les fournisseurs, valider sender IDs/templates/consentements, implémenter leurs transports exacts, injecter les secrets, puis tester succès, refus, timeout, doublon, retry, DLQ, quiet hours, langue et désabonnement.

## 6. Recette finale

Validations ciblées obligatoires après application des migrations :

```text
npm run lint
npm run typecheck
npm run test -- external-readiness-blockers orange-relay-integration kyc-security
npm run build
```

Résultats obtenus : ESLint sans avertissement, TypeScript strict réussi, 40 fichiers et 209 tests réussis, build racine réussi, build Admin réussi, 76 tables/10 buckets validés, RLS/politiques/RPC validées. Les migrations `20260722030000`, `20260722040000` et la correction ACL `20260722041000` sont appliquées. L’audit a détecté puis corrigé les droits `EXECUTE` publics : les quatre RPC de workers sont désormais limitées à `postgres` et `service_role`.

Reste à exécuter après publication : recette authentifiée KYC/notifications sur Vercel. Aucune validation empêchée par l’environnement ne doit être transformée en succès.

## Verdict actualisé

Les cinq dépendances non résolubles par le code disposent maintenant de garde-fous et d’interfaces activables, mais elles ne sont pas opérationnelles sans infrastructure, fournisseurs et décisions d’exploitation. La recette locale du sixième blocage est verte ; sa partie Vercel authentifiée attend la publication de la révision.

**YOBALELMA NON PRÊTE — BLOQUANTS INTERNES RESTANTS**

Motif : les fondations et la recette locale sont prêtes, mais les activations externes et la recette Vercel finale ne sont pas encore prouvées.
