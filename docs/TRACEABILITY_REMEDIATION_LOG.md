# Journal de remédiation traçabilité

Dernière mise à jour : 24 juillet 2026.

## Fermé

| Criticité | Défaut / cause | Correction | Test et validation | Régression |
|---|---|---|---|---|
| P1 | Écritures de manifeste fragmentées | RPC `add_collection_manifest_item_traced` | tests de contrat, audit distant | aucune détectée |
| P1 | Rangement relais direct | RPC idempotente `record_relay_storage_traced` | tests et audit cohérence | aucune détectée |
| P1 | Mutations héritées sans passeport | triggers transactionnels Collection, Relay, Hub, livraison, douane, incidents et corrections | 70/70 chaînes cohérentes | aucune détectée |
| P1 | Changement de statut contournable | constraint trigger différé imposant le journal dans la transaction | audit transitions | aucune détectée |
| P1 | Scellés non opérables | RPC, preuve photo vérifiée et anomalie sur rupture inattendue | tests de contrat | aucune détectée |
| P1 | Export PDF absent | export serveur, bucket privé, URL signée, journal d'accès et action Admin | génération et tests PDF | aucune détectée |
| P1 sécurité | Helper interne exécutable par `service_role` | droit retiré par migration | audit RLS/RPC vert | aucune exposition détectée |
| P2 | Pagination PDF orpheline | en-tête de section répété à chaque coupure | test de non-régression et inspection visuelle des 4 pages | aucune détectée |
| P2 | Test de contrat non portable Windows | résolution des chemins corrigée | suite Windows verte | aucune détectée |
| P2 | Artefacts locaux polluant Git/lint | exclusions `.next-browser-smoke`, `tmp`, logs et verrou local Hub | audit index Git et lint | aucun artefact commité |
| P1 validation | Validation technique devenue périmée après migration | relance complète | lint, TypeScript, 276 tests, six builds | aucune détectée |
| P1 validation | Comptes pilotes non vérifiés | préparation sécurisée et vérification des comptes existants | 32 sessions réelles, refus d'auto-élévation | aucune détectée |
| P1 validation | Interfaces multi-rôles non ouvertes | authentification navigateur sur les déploiements | 7 profils métier atteints | aucune détectée |
| P2 mesure | Rapports de charge sans p75/CPU/mémoire | métriques ajoutées aux harnais | campagne locale 1 000 000 événements | aucune détectée |

## Ouvert

| Criticité | Problème | Cause / dépendance | Validation requise |
|---|---|---|---|
| P1 validation | Admin non validé après connexion | facteur MFA AAL2 absent | enrôler MFA et rejouer l'interface Admin |
| P1 validation | Destinataire et chauffeur national non testés | identités distinctes absentes | créer/autoriser les comptes pilotes puis authentifier |
| P1 validation | Parcours de possession complet non rejoué | mutation de l'environnement partagé non autorisée pour cette passe | campagne isolée avec preuves et rollback/nettoyage approuvé |
| P1 validation | Charge PostgreSQL non exécutée | aucun contexte préproduction isolé autorisé ; production interdite | fournir un contexte sûr et mesurer les métriques DB |
| P1 validation | Appareils réels non testés | matériel Android/iOS indisponible | exécuter et signer la checklist |
| P1 validation | Preuves historiques non démontrées | `proof_count = 0` sur les 70 états audités | créer un colis pilote et vérifier les preuves de chaque transfert |
| P2 externe | Rétention/restauration non signées | dépendances juridique et exploitation | avis juridique et exercice réel de restauration |

## Reprise exacte

1. Enrôler le MFA administrateur et fournir les deux identités manquantes.
2. Autoriser un jeu de données pilote isolé dans le périmètre Yobalelma.
3. Rejouer tous les transferts avec preuves et tentatives de double validation.
4. Exécuter la charge PostgreSQL contrôlée hors production.
5. Signer la checklist appareils et navigateurs.
6. Relancer les audits et statuer sur le verdict A ou B.
