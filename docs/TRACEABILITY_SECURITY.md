# Sécurité de la traçabilité

- Authentification Supabase obligatoire pour toute écriture.
- Validation Zod côté API et validation indépendante dans les RPC.
- RLS propriétaire/pays/rôle sur événements, projection, preuves, scellés, anomalies et accès.
- Révocation des écritures directes : mutations via fonctions seulement.
- Événements non modifiables et non supprimables ; preuves non supprimables.
- QR/OTP réutilisent les mécanismes serveur existants ; les OTP clairs ne sont ni persistés ni journalisés.
- Fichiers référencés par bucket/chemin privé, destinés aux URL signées temporaires.
- Idempotency key, QR à usage unique existant et double livraison interdite limitent le rejeu.
- L’événement Control Tower ne contient que colis, étape, type de détenteur, identifiant de lieu et confiance ; aucune identité client ni preuve brute.

Rétention par défaut des preuves : cinq ans, avec `legal_hold`. Une suppression réglementaire future doit anonymiser ou archiver selon base légale sans casser la chaîne de preuve. Le journal d’accès est réservé admin, sécurité et audit.

Risques restants : scanner antimalware externe non activé, politique de rétention à faire valider juridiquement par pays, test d’intrusion et recette multi-pays authentifiée non réalisés dans cette session.
