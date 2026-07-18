# Relay App — rapport de préparation production

Date de validation : 18 juillet 2026.

## Livraison

Relay App est une application Next.js autonome destinée aux agents de points relais Orange et partenaires. Elle conserve l’identité Yobalelma, fonctionne sur mobile, tablette et desktop, propose les modes clair et sombre, et reste utilisable hors ligne.

## Fonctionnalités

- Tableau de bord, réception, contrôle qualité, QR, code-barres, pesée, dimensions et photos.
- Inventaire, stockage intelligent, emplacements, rayonnages, casiers et recherche globale.
- Remise au transporteur interne, remise au destinataire, OTP, signature, étiquettes et reçus.
- Historique, incidents, anomalies, refus, attentes, notifications, support, profil et paramètres.
- PWA hors ligne, cache applicatif, file locale et synchronisation idempotente.
- Assistance : détection des retards, colis oubliés, écarts de poids et erreurs de rangement ; recommandation d’emplacement et prévision de capacité.
- Localisation : neuf langues, RTL arabe, fuseaux horaires, devises, formats de date et unités locales.

## Sécurité

- Supabase Auth et rôles `relay_agent`, `relay_manager`, `operations_manager`.
- RLS cloisonnée par point relais ; un manager ne peut pas administrer un autre établissement.
- RPC de remise avec OTP obligatoire pour le destinataire, signature et idempotence.
- Validation Zod, contrôle same-origin/CSRF, limitation de débit et journaux structurés corrélés.
- CSP, HSTS, X-Frame-Options, nosniff et politique de permissions via les en-têtes partagés.
- Aucun secret stocké dans le dépôt ; seul le projet Supabase Yobalelma est autorisé.

## Résultats de validation

| Contrôle | Résultat |
|---|---:|
| TypeScript strict | Vert |
| ESLint | Vert, 0 avertissement |
| Tests unitaires | 9/9 |
| Build Next.js production | Vert |
| Auth/RLS réels | 8 contrôles verts |
| E2E desktop/mobile/tablette | 9 réussis, 6 scénarios non applicables ignorés |
| Audit des 30 pages | Vert |
| Captures de démonstration | 10 générées |

Les données pilotes utilisent le point Orange Plateau et un second point partenaire pour valider l’isolation RLS. Les mots de passe de validation ont été générés et rotatés hors dépôt.

## Parcours de démonstration

1. Ouvrir le tableau de bord du point Orange Plateau.
2. Réceptionner `YBL-SN-2607-0202` par scan et contrôler sa conformité.
3. Accepter la recommandation d’emplacement et vérifier l’inventaire.
4. Préparer un lot pour le transporteur interne et signer le manifeste.
5. Remettre un colis au destinataire après OTP à six chiffres, signature et reçu.
6. Consulter les anomalies IA, puis basculer hors ligne et vérifier la reprise de synchronisation.

Les captures se trouvent dans `docs/visual-demo/relay-app/`.
