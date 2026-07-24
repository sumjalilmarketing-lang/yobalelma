# AI Rules Engine

Les règles sont explicitement des règles métier, jamais présentées comme un modèle. Elles ont une clé, une version, un état, une portée pays/ville/partenaire/type de colis/risque, une condition, des rôles autorisés et un caractère sensible.

Une version active doit avoir été approuvée. L’évaluation est déterministe et testable. Les règles couvrent notamment preuve manquante, capacité critique, GPS ancien, paiement non confirmé, document douanier absent et incohérences de possession; leur activation métier reste à valider pays par pays.
