# Audit final de traçabilité

Date initiale : 22 juillet 2026.  
Dernière validation : 24 juillet 2026.

## Résultat distant vérifié

- Projet Supabase Yobalelma autorisé uniquement : `rgcgtcycbiuhcaoaadbh`.
- 66 migrations appliquées et zéro migration en attente.
- 118 tables et 11 buckets validés.
- 70 colis, 70 états de possession et 70 événements initiaux.
- Zéro colis sans détenteur, anomalie active, trou de séquence, lien de hash cassé, état incohérent ou double livraison confirmée.
- Historique append-only, verrou par colis, transitions contrôlées, protections de preuves et idempotence actifs.
- Audit RLS/RPC vert : aucune politique ou activation RLS manquante, aucune fonction sensible exposée à `anon`.
- Contrôle `run_parcel_traceability_consistency_audit()` réservé au `service_role`.

## Actions auditées et recâblées

| Domaine | Écriture autoritative |
|---|---|
| Création colis | initialisation automatique du passeport à l'insertion du colis |
| Collecte | mouvement terrain et ajout au manifeste atomique |
| Relais | scans/statuts, rangement atomique, remise OTP/signature |
| Hub | réception, inspection/anomalie, stockage, remise au voyageur avec deux preuves |
| Livraison finale | preuve, tentative, sortie livraison et remise destinataire |
| Douane | événements assainis reliés au passeport |
| Incidents/corrections | événement append-only, correction liée, aucune réécriture de l'historique |
| Scellés | application/rupture avec photo vérifiée et anomalie critique si rupture inattendue |
| Statuts hérités | garde différée imposant un événement dans la même transaction |
| Control Tower | événement assaini et outbox dans la transaction de traçabilité |

## Validation technique finale

- ESLint : réussi, zéro avertissement.
- TypeScript strict : réussi.
- Vitest : 49 fichiers, 276/276 tests réussis.
- Builds : racine 83 pages, User 56, Collection 14, Relay 14, Hub 23 et Admin 17.
- PDF : défaut P2 de pagination orpheline corrigé, test de non-régression ajouté, rendu Poppler et inspection visuelle des quatre pages réussis.
- Supabase : migrations, inventaire, sécurité RLS/RPC et cohérence de la chaîne réussis.
- Un échec réseau transitoire groupé a été suivi de quatre relances séparées réussies ; aucune divergence fonctionnelle n'a été observée.

## Recette authentifiée réellement exécutée

- Préparation du catalogue pilote : 32 comptes, mots de passe uniques conservés dans un fichier local ignoré par Git.
- Vérification API réelle : 32/32 sessions mot de passe, 32 e-mails vérifiés, 28 adresses délivrables, zéro MFA AAL2.
- Contrôle d'autorisation : auto-élévation de rôle refusée.
- Interfaces déployées, authentification réelle et page métier atteinte sans overflow horizontal :
  - client expéditeur ;
  - voyageur ;
  - livreur local ;
  - agent Collection ;
  - agent Relais ;
  - agent Hub ;
  - superviseur Hub.
- Administrateur : mot de passe accepté, redirection MFA correcte, validation métier bloquée faute de facteur AAL2.

## Non exécuté

- client destinataire distinct et chauffeur national distinct, absents du catalogue ;
- parcours mutatif complet et vérification transfert par transfert ;
- double validation réelle sur un même colis ;
- export PDF Admin avec session AAL2 et contrôle d'un colis tiers ;
- charge PostgreSQL préproduction et métriques base de données ;
- QR, caméra, GPS, arrière-plan, photo, signature et reprise offline sur matériel réel ;
- Edge et Safari réels.

Les 70 colis audités ont `proof_count = 0`. Ce constat ne remet pas en cause la cohérence cryptographique mesurée, mais empêche de conclure que les preuves terrain historiques sont complètes. Aucun élément non exécuté n'est déclaré réussi.
