# Préparation Orange Money — Yobalelma

## Statut

**ORANGE MONEY PRÉPARÉ — IDENTIFIANTS OFFICIELS REQUIS**

Le code ne contient aucun endpoint Orange supposé et aucune valeur factice. L’adaptateur officiel reste verrouillé tant que le contrat, le mapping d’API et les accès du pays concerné ne sont pas fournis. En production, le mode `test` est refusé et aucune redirection navigateur ne peut valider un paiement.

Orange indique publiquement que Web Payment / M Payment est réservé aux marchands Orange Money agréés et conformes KYA, que les conditions dépendent de l’opérateur local et que les détails de production sont remis après les tests. Sources officielles :

- https://developer.orange.com/apis/om-webpay
- https://developer.orange.com/apis/om-webpay/faq
- https://developer.orange.com/products/payment/

## Architecture

`PaymentProvider` expose :

- `createPayment` ;
- `getPaymentStatus` ;
- `confirmPayment` ;
- `cancelPayment` ;
- `refundPayment` ;
- `processWebhook` ;
- `reconcileTransaction` ;
- `initiatePayout` ;
- `getPayoutStatus`.

Implémentations :

- `TestPaymentProvider` : tests et recette locale uniquement, aucun débit et aucun identifiant fournisseur ;
- `OrangeMoneyPaymentProvider` : transport serveur officiel, activable uniquement avec identifiants et mapping contractuel ;
- les noms `wave` et `card` sont réservés dans le contrat commun sans implémentation fictive.

Le navigateur ne fournit jamais le montant ni la devise. L’API recharge le colis appartenant à l’utilisateur, lit le prix côté serveur, impose l’idempotence et crée une référence interne distincte de toute référence Orange.

## Endpoints internes

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/payments/intents` | crée une demande idempotente depuis le montant serveur |
| GET | `/api/payments/:id/status` | interroge le fournisseur côté serveur ou affiche l’état test explicite |
| POST | `/api/payments/webhooks/orange-money` | refuse tout événement non authentifié ou adaptateur incomplet |
| POST | `/api/admin/finance/refunds` | soumet un remboursement à autorisation |
| GET | `/api/admin/finance/export` | export CSV protégé contre l’injection de formules |

Écrans Admin :

- `/command/finance/paiements` ;
- `/command/finance/reversements`.

## Schéma

Migration : `supabase/migrations/20260722020000_orange_money_payment_foundation.sql`.

- `payments` : montant en unité mineure, propriétaire, colis, fournisseur, idempotence et cycle complet ;
- `payment_events` : événements authentifiés, payload nettoyé, déduplication fournisseur ;
- `refunds` : demande, autorisation et référence fournisseur ;
- `payouts` : fournisseur, validations, échecs, reprises et double validation ;
- `ledger_entries` : journal append-only protégé par trigger.

La fonction serveur `apply_verified_payment_event` verrouille la transaction, refuse une référence fournisseur incohérente, ignore un webhook dupliqué, protège un succès contre une régression et inscrit l’écriture comptable une seule fois.

## Variables requises

Les noms ci-dessous sont des emplacements Yobalelma. Ils devront être adaptés au dossier remis par Orange sans copier de secret dans Git :

- `ORANGE_MONEY_ENV` ;
- `ORANGE_MONEY_BASE_URL` ;
- `ORANGE_MONEY_CLIENT_ID` ;
- `ORANGE_MONEY_CLIENT_SECRET` ;
- `ORANGE_MONEY_MERCHANT_KEY` ;
- `ORANGE_MONEY_MERCHANT_ID` ;
- `ORANGE_MONEY_CALLBACK_URL` ;
- `ORANGE_MONEY_WEBHOOK_SECRET` ;
- `ORANGE_MONEY_COUNTRY_CODE` ;
- `ORANGE_MONEY_CURRENCY`.

`PAYMENT_PROVIDER_MODE=test` n’est accepté qu’hors production.

## Informations officielles manquantes

1. pays et entité Orange cocontractante ;
2. preuve du statut marchand et validation KYA/KYB ;
3. offre exacte : encaissement, remboursement et/ou payout ;
4. documentation versionnée sandbox et production ;
5. URL OAuth/token et mécanisme d’authentification exact ;
6. endpoints, méthodes, champs et unités de montant ;
7. format du numéro, devise et limites par transaction ;
8. statuts Orange et leur mapping interne ;
9. format d’idempotence pris en charge ;
10. en-tête, algorithme, canonicalisation et fenêtre anti-rejeu des webhooks ;
11. procédure de récupération après webhook manquant ;
12. SLA, timeouts, quotas et règles de retry ;
13. capacités et règles de remboursement partiel/total ;
14. disponibilité contractuelle des reversements et double validation ;
15. fichiers ou API de rapprochement et calendrier de règlement ;
16. identifiants sandbox, jeux de tests certifiants et critères de passage en production ;
17. contacts fraude, incident, finance et astreinte Orange.

## Passage sandbox vers production

1. signer l’offre locale et terminer KYA/KYB ;
2. recevoir la documentation et figer un `OrangeMoneyContractMapping` versionné ;
3. installer les secrets sandbox dans l’environnement sécurisé ;
4. exécuter les scénarios de succès, refus, expiration, timeout, doublon, remboursement et rapprochement ;
5. faire valider les résultats par Orange ;
6. appliquer la migration et vérifier RLS, sauvegarde et restauration ;
7. configurer l’URL HTTPS du webhook et la liste d’adresses si fournie ;
8. activer alertes, files de reprise et rapprochement quotidien ;
9. installer séparément les secrets production ;
10. effectuer un paiement réel de faible montant et son remboursement, puis valider le ledger ;
11. activer progressivement par pays et devise ;
12. conserver un kill switch qui bloque les nouvelles initiations sans modifier les paiements déjà reçus.

## Rotation des clés

Créer un second jeu chez Orange lorsque possible, l’ajouter au coffre Vercel, redéployer, vérifier token et webhook, basculer le trafic, révoquer l’ancien jeu, puis enregistrer l’opération dans le journal d’audit. Ne jamais consigner les valeurs ou les quatre derniers caractères des secrets.

## Rapprochement

Chaque jour : comparer montant, devise, référence fournisseur et statut à l’API/fichier Orange ; classer les écarts (`missing_provider`, `missing_internal`, `amount_mismatch`, `status_mismatch`) ; bloquer le reversement associé ; faire corriger par deux personnes ; inscrire uniquement des écritures compensatoires dans le ledger immuable.

## Remboursement

Un agent autorisé crée la demande ; une autre personne l’approuve ; le serveur vérifie le montant résiduel et le contrat ; l’adaptateur envoie une clé d’idempotence ; le statut reste `refund_pending` jusqu’à confirmation Orange ; le webhook authentifié ou le rapprochement clôture l’opération et ajoute l’écriture inverse.

## Risques résiduels

- contrat et identifiants absents ;
- endpoint et signature webhook inconnus ;
- capacités de remboursement et reversement non confirmées ;
- aucune transaction Orange sandbox ou production exécutée ;
- rate limiting applicatif à compléter par une protection distribuée Vercel/Redis ;
- certification Orange, test de charge financier et exercice de reprise encore requis.

## Validation du 22 juillet 2026

- migration appliquée au projet Supabase Yobalelma ;
- 73 tables contrôlées à distance, sans table manquante ;
- RLS, politiques et fonctions financières contrôlées, sans anomalie détectée ;
- 198 tests réussis dans 38 fichiers, dont 16 scénarios Orange Money dédiés ;
- lint sans avertissement et TypeScript strict validé ;
- builds racine, User App et Admin App réussis ;
- aucune transaction Orange sandbox ou production exécutée, faute d’accès officiel.
