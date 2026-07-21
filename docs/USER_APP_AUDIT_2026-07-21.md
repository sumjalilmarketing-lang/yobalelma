# Audit User App — 21 juillet 2026

## Statut de la phase

La User App est en cours de durcissement. Le build local de production est valide, mais cette version ne doit pas être déclarée « entièrement validée » avant son déploiement, les tests authentifiés sur l’URL de production et la levée des dépendances externes listées ci-dessous.

- Application : User App uniquement
- Projet Vercel : **africrm/yobalelma-user**
- URL durable actuelle : **https://yobalelma-user.vercel.app**
- Répertoire Vercel : **apps/user-app**
- Branche de travail : **codex/hub-enterprise-upgrade**
- Projet d’identité et de données autorisé : **https://rgcgtcycbiuhcaoaadbh.supabase.co**

## Matrice de vérité

| Domaine | État | Preuve ou limite |
| --- | --- | --- |
| Authentification par mot de passe | Fonctionnel, durci localement | Redirection interne contrôlée, rôle externe obligatoire, compte actif obligatoire |
| Confirmation e-mail | Fonctionnel | Les comptes non actifs sont bloqués et un message utilisateur dédié est affiché |
| Mot de passe oublié | Fonctionnel | Réponse uniforme qui ne révèle pas l’existence d’un compte |
| Contrôle des rôles | Fonctionnel, durci localement | Le profil ne peut plus modifier un rôle ; les rôles internes sont refusés par la User App |
| Profil client, voyageur et livreur | Fonctionnel localement | Formulaire prérempli ; seules les coordonnées personnelles sont modifiables |
| Expéditions | Fonctionnel | Création, liste, détail, suivi et données rattachées au propriétaire |
| Voyages | Fonctionnel | Création, liste, détail et rattachement au voyageur connecté |
| Billets voyageur | Fonctionnel localement | Téléversement réel, choix d’un voyage possédé, aucun résultat synthétique |
| Vérification d’identité | Partiel | Dépôt sécurisé disponible ; validation opérationnelle dépend des équipes et règles de conformité |
| Missions livreur | Fonctionnel | Liste, détail, transitions et dépôt sécurisé des preuves |
| Assistance | Fonctionnel localement | Création de demandes et historique sans identifiants techniques visibles |
| Notifications intégrées | Fonctionnel localement | Historique personnel avec libellés métier |
| Adresses | Partiel | Adresses récentes et adresse principale consultables ; carnet CRUD dédié absent |
| Paiements | Simulé hors production, bloqué en production | Aucun prestataire réel configuré ; le montant est imposé par l’expédition côté serveur |
| SMS, WhatsApp, e-mail transactionnel, push | Bloqué par intégration externe | Aucun fournisseur commercial et aucun identifiant de production validé |
| Géolocalisation opérationnelle | Manquant | Consentement, collecte minimale, rétention et parcours produit à définir |
| Gestion avancée des sessions | Manquant | Historique des connexions, révocation par appareil et alertes dédiées absents |
| Export et suppression du compte | Manquant | Parcours utilisateur, délai de rétention et validation juridique à définir |
| Consentements et préférences de communication | Partiel | Préférences d’expérience présentes ; registre de consentement versionné absent |
| Supervision et alertes | Bloqué par intégration externe | Aucun fournisseur d’observabilité ou d’astreinte configuré |
| Limitation distribuée des tentatives | Partiel | Protections du fournisseur d’identité présentes ; limite applicative distribuée absente |

## Vulnérabilités corrigées dans le lot local

| Référence | Gravité | Constat | Correction | Validation |
| --- | --- | --- | --- | --- |
| UA-SEC-01 | Critique | Le formulaire profil pouvait réécrire le rôle principal | Suppression totale des rôles du schéma et de la mise à jour profil | Test source anti-régression et typage strict |
| UA-SEC-02 | Élevée | La connexion acceptait une redirection fournie par le navigateur | Passage obligatoire par la validation des redirections internes | Tests de sécurité existants |
| UA-SEC-03 | Élevée | Un rôle interne pouvait ouvrir une session via la User App | Sélection limitée à client, voyageur et livreur ; déconnexion sinon | Test de rôle et revue du handler |
| UA-SEC-04 | Élevée | Un extracteur de billet fabriquait des informations depuis le nom du fichier | Suppression complète du composant synthétique | Test d’absence et vrai téléversement E2E |
| UA-SEC-05 | Élevée | Les téléversements n’imposaient ni taille ni type par espace documentaire | Règles MIME et tailles maximales côté serveur | Tests, lint, typage et build |
| UA-SEC-06 | Élevée | Plusieurs API acceptaient un chemin documentaire appartenant potentiellement à un autre compte | Préfixe obligatoire par identifiant utilisateur et contrôle de propriété | Tests et revue des routes |
| UA-SEC-07 | Moyenne | Des erreurs internes pouvaient être renvoyées ou affichées telles quelles | Nettoyage global des réponses et messages métier dans les vues | Test de réponse globale |
| UA-SEC-08 | Élevée | Le middleware laissait passer les routes protégées si la configuration était absente | Échec fermé avec indisponibilité temporaire | Test source anti-régression |
| UA-SEC-09 | Élevée | Le navigateur choisissait le montant et la devise d’une demande de paiement | Montant et devise relus depuis l’expédition possédée | Schéma strict, tests opérations |
| UA-SEC-10 | Élevée | Le mode de paiement simulé pouvait être appelé en production | Blocage explicite en production jusqu’à un prestataire réel | Test source anti-régression |
| UA-SEC-11 | Élevée | Un statut de compte inconnu pouvait être assimilé à actif | Valeur inconnue considérée en attente, accès bloqué | Tests d’authentification |
| UA-SEC-12 | Moyenne | La récupération de mot de passe pouvait relayer une erreur du fournisseur | Réponse uniforme et non énumérable | Revue du handler |

## Validation locale du lot

- Lint ciblé User App et composants partagés : réussi.
- TypeScript strict : réussi.
- Tests ciblés : 43 réussis, 0 échec.
- Suite complète du monorepo : 161 réussis, 0 échec.
- Build Next.js de production User App : réussi, 55 pages générées.
- Build Next.js complet du monorepo : réussi, 76 pages générées.
- Audit des dépendances de production : 0 vulnérabilité connue lors du contrôle du 21 juillet 2026.

Le build signale un avertissement connu lié à l’utilisation d’une API Node par la bibliothèque cliente dans le middleware Edge. Il ne bloque pas la compilation, mais doit être éliminé lors de l’évolution du middleware.

## Conditions restantes avant validation complète

1. Ajouter un prestataire de paiement réel avec clés séparées par environnement, signatures de webhooks, idempotence et rapprochement.
2. Ajouter les fournisseurs de communication réels nécessaires et tester les échecs, reprises et consentements.
3. Ajouter une limitation distribuée sur les opérations sensibles.
4. Ajouter observabilité, alertes et procédure d’incident.
5. Terminer le carnet d’adresses, la gestion des sessions, l’export et la suppression de compte.
6. Déployer ce lot sur le projet Vercel User App uniquement.
7. Exécuter sur l’URL HTTPS les scénarios authentifiés client, voyageur, livreur et multirôle, y compris les refus de routes.
8. Réaliser un test de sécurité externe avant toute qualification de production définitive.

## Décision

La version locale est plus sûre et plus honnête que la version actuellement publiée. La User App reste **partiellement validée** tant que les conditions restantes ne sont pas satisfaites. Relay App ne doit pas commencer avant la clôture explicite de cette phase.
