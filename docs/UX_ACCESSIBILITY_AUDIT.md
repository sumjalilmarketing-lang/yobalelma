# Audit UX et accessibilité

## Périmètre

Contrôle du Control Tower et reprise des audits existants des cinq applications. Navigation clavier, noms accessibles, responsive, erreurs, vides, chargement, tableaux et carte ont été examinés.

## Corrections

- Carte : recherche libellée, couches avec `aria-pressed`, zoom, plein écran, sélection multiple, fiches et état vide.
- Timeline : recherche, filtre, vitesse, lecture/pause, précédent/suivant, curseur accessible.
- Sources : temps réel/différé/indisponible et horodatage explicite.
- Assertions E2E mises en cohérence avec « Connexion sécurisée » et les champs d’adresse accessibles.
- Mobile/tablette compilent ; la recette visuelle Admin est préparée pour trois viewports.

## Preuves et limites

28 contrôles E2E d’accès anonyme et les parcours authentifiés critiques passent. Les trois captures Control Tower ont été ignorées faute de `ADMIN_E2E_PASSWORD`. Aucun audit lecteur d’écran humain complet ni campagne WCAG automatisée exhaustive n’a été exécuté ; ce risque reste P2 de préproduction.
