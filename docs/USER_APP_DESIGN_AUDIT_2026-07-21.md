# Audit design User App — 21 juillet 2026

## Objectif

Rendre l’interface plus claire, simple et lisible, tout en préservant l’identité Yobalelma et la cohérence du Design System partagé.

## Constats corrigés

- Les textes secondaires utilisaient parfois une opacité trop faible sur les cartes claires.
- Le décor animé du bandeau pouvait traverser visuellement les titres et descriptions.
- L’orange de marque était utilisé comme couleur de petit texte et de bouton, avec un contraste insuffisant sur fond blanc.
- Les motifs décoratifs des cartes concurrençaient le contenu.
- L’en-tête affichait « Connexion » même pendant une session authentifiée.
- Plusieurs libellés visibles n’avaient pas leurs accents ou employaient des formulations techniques.
- Les libellés de statut et les textes désactivés manquaient de présence.

## Décisions de design

- L’orange vif reste réservé à la signature de marque et aux accents décoratifs.
- Les contrôles interactifs utilisent un orange plus profond, lisible avec du texte blanc.
- Les textes secondaires sont renforcés et gardent une hiérarchie claire sans devenir gris pâle.
- Le hero reçoit un voile de contraste et un calque de contenu prioritaire.
- Les motifs de fond sont réduits à un niveau discret.
- L’en-tête devient contextuel : « Mon espace » et déconnexion lorsqu’une session est ouverte.
- Les textes visibles sont reformulés dans un langage simple, professionnel et centré utilisateur.

## Validation attendue

- Aucun chevauchement entre le décor et le contenu.
- Titres, descriptions, libellés, aides et états lisibles sur mobile et ordinateur.
- Navigation cohérente pour une session ouverte ou fermée.
- Aucun débordement horizontal à 390 px.
- Parcours connexion, espace client, paiements, profil, expéditions et réglages vérifiés.
