# Admin App — sécurité et cloisonnement

- Projet de données autorisé : Yobalelma `rgcgtcycbiuhcaoaadbh` uniquement.
- Authentification réelle côté serveur.
- Rôles internes attribués dans `user_roles`; aucune inscription publique à un rôle interne.
- Affectations validées contre le service déclaré du rôle.
- Lecture et écriture limitées par service, responsabilité et affectation.
- Managers limités à leur service, sauf Direction générale et pilotage central explicitement autorisés.
- Agents limités aux missions attribuées ou visibles dans leur périmètre.
- Transitions protégées à deux niveaux : validation applicative et déclencheur SQL.
- Preuve obligatoire avant soumission au contrôle.
- Validation obligatoire avant clôture.
- Contrôle d’origine, limitation de débit, validation Zod et messages utilisateurs normalisés.
- Aucun secret et aucun fichier `.env` dans le dépôt.

Les fonctions internes créant tâches, notifications et missions interservices s’exécutent avec des privilèges contrôlés, ne sont pas appelables directement par les utilisateurs et conservent la RLS sur les lectures et actions humaines.
