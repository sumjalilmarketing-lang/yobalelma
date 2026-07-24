# Dépendances externes de traçabilité

| Dépendance | Usage | État |
|---|---|---|
| Supabase Yobalelma `rgcgtcycbiuhcaoaadbh` | PostgreSQL, Auth, RLS, Storage | Migration appliquée ; 63 migrations, 0 en attente, audit RLS vert |
| Scanner appareil / caméra | QR, code-barres, photos | Recette matérielle requise |
| Cartographie | représentation et géocodage | Fournisseur officiel à configurer selon environnement |
| SMS / WhatsApp / email | OTP et notifications | Accès fournisseur et modèles requis |
| Scanner antimalware | photos/documents | Contrat fournisseur non activé |
| PDF serveur | export Passeport | À implémenter et auditer |
| APM / astreinte | latence, alertes et incidents | Fournisseur et réception humaine non prouvés |

Aucune de ces dépendances n’est simulée comme active. Le module échoue explicitement ou masque la fonctionnalité lorsque la configuration manque.
