# Reprise après sinistre

## Objectifs à valider

- RPO cible : 24 heures maximum tant qu’une fréquence plus stricte n’est pas contractualisée.
- RTO cible : 4 heures entre la déclaration et la validation fonctionnelle.
- Source autorisée : projet Yobalelma `rgcgtcycbiuhcaoaadbh` uniquement.
- Cible : projet Supabase isolé, vide et non relié aux domaines de production.

Ces valeurs sont des objectifs, pas des résultats acquis. Elles ne deviennent validées qu’après un exercice chronométré.

## Exercice trimestriel

1. Créer une cible isolée avec région et version PostgreSQL compatibles.
2. Exporter la sauvegarde gérée choisie et noter son horodatage.
3. Restaurer schéma, rôles, données et objets Storage sur la cible.
4. Appliquer les migrations ultérieures à la sauvegarde.
5. Définir localement `DR_SOURCE_URL`, `DR_SOURCE_SERVICE_KEY`, `DR_TARGET_URL` et `DR_TARGET_SERVICE_KEY`; ne jamais les committer.
6. Exécuter `node scripts/verify-disaster-recovery.mjs` et conserver uniquement sa sortie de comptages.
7. Tester authentification, lecture d’une expédition, chaîne Hub/Relay/Collection et intégrité d’un document privé avec des comptes de recette.
8. Détruire les secrets temporaires puis la cible selon la politique de conservation.

Le script refuse une cible identique à la production et contrôle les volumes des tables critiques sans lire ni afficher leur contenu.

## Critères de succès

- Tous les comptages critiques correspondent.
- Aucune cible de test n’est accessible par les domaines publics.
- Les politiques RLS et le lint SQL passent.
- Le chronomètre respecte le RTO et l’horodatage de la sauvegarde respecte le RPO.
- Un rapport signé indique sauvegarde, début, fin, écarts, décisions et participants.

## Statut actuel

La procédure et le validateur sont disponibles. Aucun projet cible isolé ni preuve de restauration complète n’a encore été fourni; le blocage GRA-004 reste donc ouvert.
