# Relay App — rapport de préparation production

Date de validation : 20 juillet 2026.

## Périmètre livré

Relay App est une application Next.js autonome réservée aux équipes des points relais Yobalelma. Elle utilise le logo officiel, le Design System commun et une interface responsive sur ordinateur, tablette et mobile.

Les parcours opérationnels suivants sont raccordés aux données Yobalelma :

- authentification réelle et droits `relay_agent`, `relay_manager`, `operations_manager` ;
- chargement du point relais, de l’inventaire, des emplacements et de l’historique autorisés ;
- réception d’un colis avec contrôle d’origine, limitation de débit et idempotence ;
- contrôle poids, dimensions, conformité et justificatifs avec décision enregistrée ;
- affectation d’un emplacement compatible et actualisation de l’inventaire ;
- remise au transporteur avec identité et justificatif signé ;
- remise au destinataire après vérification réelle du code à usage unique ;
- recherche, incidents, points à vérifier, notifications, profil et paramètres ;
- continuité d’interface lorsque le terminal perd sa connexion.

Le mode de démonstration reste limité aux environnements non productifs. En production, les écrans ne remplacent jamais silencieusement les données réelles par des données simulées.

## Qualité de l’interface

- logo officiel sur la connexion et la navigation ;
- libellés professionnels pour les rôles, états, événements, emplacements et erreurs ;
- aucune erreur brute ni mention d’infrastructure affichée à l’utilisateur ;
- états vides explicites pour inventaire, historique, alertes et emplacements ;
- commandes désactivées lorsque les informations obligatoires manquent ;
- tableaux défilables et navigation mobile dédiée ;
- thèmes clair et sombre conservés.

## Sécurité

- sessions serveur et profils autorisés par rôle ;
- cloisonnement des données par point relais ;
- validation Zod, contrôle d’origine, limitation de débit et identifiants d’opération uniques ;
- code de remise vérifié côté serveur avant la sortie du colis ;
- justificatif de remise signé et journalisé ;
- messages d’erreur normalisés sans divulgation interne ;
- aucun secret ni fichier `.env` ajouté au dépôt.

## Résultats locaux

| Contrôle | Résultat |
|---|---:|
| ESLint | Réussi, 0 avertissement |
| TypeScript strict | Réussi |
| Tests unitaires | 9/9 |
| Build Next.js production | Réussi |
| E2E desktop, mobile et tablette | 9 réussis, 6 scénarios non applicables ignorés |
| Parcours réception → contrôle → rangement → remise | Réussi |
| Authentification réelle et toutes les routes agent | Réussi |
| Captures visuelles | 10 générées et contrôlées |

Les profils pilotes utilisent un secret temporaire généré en mémoire. Sa valeur n’est ni affichée, ni écrite sur disque, ni commitée.

## Déploiement

Relay App doit rester dans le projet Vercel séparé `yobalelma-relay`, avec `apps/relay-app` comme répertoire racine. L’URL et le commit de production sont consignés dans le rapport final après validation distante.
