# Préparation production — traçabilité

Dernière validation : 24 juillet 2026.

## Verdict strict

**B.**

**TRAÇABILITÉ PARTIELLEMENT VALIDÉE**  
**VALIDATIONS TERRAIN RESTANTES**

Le verdict A est interdit à cette date : la chaîne complète de possession n'a pas été rejouée avec les neuf profils demandés, la charge PostgreSQL préproduction n'a pas pu être exécutée dans un environnement isolé autorisé, et aucun appareil physique Android ou iOS n'était accessible.

## Acquis vérifiés

- 66 migrations appliquées, zéro migration en attente ;
- 70/70 colis cohérents, zéro trou de séquence, lien de hash cassé, double livraison ou rupture de chaîne ;
- audit RLS/RPC vert, 118 tables et 11 buckets validés ;
- historique append-only, verrou par colis, transitions contrôlées et idempotence actifs ;
- export PDF serveur, stockage privé, URL signée et pagination contrôlée visuellement sur les quatre pages ;
- ESLint sans avertissement, TypeScript strict, 49 fichiers et 276/276 tests verts ;
- six builds verts : racine 83 pages, User 56, Collection 14, Relay 14, Hub 23 et Admin 17 ;
- 32 comptes pilotes authentifiés par mot de passe contre Supabase, 32 sessions valides, 32 e-mails vérifiés et refus d'auto-élévation de rôle vérifié ;
- sept profils authentifiés dans les interfaces déployées : client expéditeur, voyageur, livreur local, agent Collection, agent Relais, agent Hub et superviseur Hub ;
- aucun secret, fichier `.env`, token, mot de passe, donnée personnelle réelle ou artefact local inclus dans les commits ;
- branche courante committée et poussée sur GitHub.

## Limites qui maintiennent B

- le profil administrateur atteint correctement le contrôle MFA, mais aucun facteur AAL2 n'est enrôlé : l'interface Admin n'est donc pas validée ;
- aucun compte distinct « client destinataire » ni « chauffeur national » n'est présent dans le catalogue pilote ;
- le parcours mutatif complet Client → Relais → Chauffeur → Hub → Voyageur/transporteur → Hub destination → Chauffeur local → Relais/destinataire n'a pas été exécuté sur l'environnement partagé ;
- les 70 états audités ne contiennent aucune preuve historique (`proof_count = 0`) : les mécanismes existent, mais la présence de preuves terrain réelles n'est pas démontrée ;
- la charge PostgreSQL contrôlée n'a pas été lancée : le harnais protège le projet de production et les paramètres d'un contexte isolé autorisé sont absents ;
- les métriques PostgreSQL (CPU, mémoire, connexions, locks, deadlocks, requêtes lentes, latence RPC et événements) ne sont donc pas mesurées ;
- Android, iOS, Edge et Safari sur matériel réel ne sont pas testés ;
- la validation juridique de rétention et l'exercice de restauration restent externes.

## Conditions restantes pour A

1. Enrôler un facteur MFA AAL2 pour l'administrateur pilote.
2. Fournir des identités distinctes de destinataire et chauffeur national.
3. Exécuter le parcours complet avec preuves, QR/OTP, GPS, notifications, Passeport Logistique, Digital Twin, Control Tower et refus de double validation.
4. Exécuter la campagne PostgreSQL dans un contexte isolé explicitement autorisé sans charge dangereuse sur la production.
5. Signer la checklist sur appareils physiques Android et iOS ainsi que Chrome, Edge et Safari disponibles.
6. Capturer les preuves et confirmer l'absence de P0/P1 après ces campagnes.
