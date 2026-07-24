# Checklist appareils et navigateurs — traçabilité

Date : 22 juillet 2026.

| Cible | Parcours | État | Preuve / limite |
|---|---|---|---|
| Navigateur intégré, viewport 375×844 | `/suivi` | Réussi | H1 présent, formulaire/bouton présents, aucune erreur console, aucun overflow horizontal. Émulation seulement. |
| Navigateur intégré, viewport 1425×900 | `/auth/sign-in` | Réussi | H1 et champs d’authentification présents, aucune erreur console, aucun overflow horizontal. Émulation seulement. |
| Navigateur intégré, bureau par défaut | `/` | Réussi | contenu principal et accès rapides rendus. |
| Android Chrome physique | scan QR, caméra, GPS, offline/reprise | Non exécuté | appareil et staging absents. |
| iPhone Safari physique | scan QR, caméra, GPS, offline/reprise | Non exécuté | appareil et staging absents. |
| Tablette Android/iPadOS | hub/relais, orientation, clavier | Non exécuté | appareil et staging absents. |
| Chrome/Edge/Firefox/Safari desktop physiques | multi-rôles, PDF, preuve | Non exécuté | comptes et staging absents. |

## Critères de signature terrain

- caméra refusée/acceptée, QR invalide/expiré/rejoué ;
- GPS refusé, imprécis, hors zone et reprise réseau ;
- double scan concurrent, retry idempotent et conflit offline ;
- photo/signature/OTP, PDF autorisé puis refus colis tiers ;
- lisibilité, focus clavier, zoom 200 %, rotation et absence de perte de saisie.

Aucun appareil non testé n’est déclaré validé.
