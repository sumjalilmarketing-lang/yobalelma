# Yobalelma Design System

## Objectif

Yobalelma doit transmettre confiance, mobilite, elegance, innovation, ouverture internationale et identite africaine moderne. Le design system sert a garder cette experience coherente sur les pages publiques, les formulaires et les dashboards metier.

## Palette

- Orange officiel: action principale, signal de route, preuves et scans.
- Noir profond: navigation, hero, dashboards critiques et contraste premium.
- Blanc: surfaces de travail, formulaires et lisibilite.
- Sable africain: contexte chaleureux, fonds doux et modules client.
- Brun terre: hub, logistique, stockage et consolidation.
- Vert nature: relais, proximite et operations de terrain.
- Bleu ciel: voyage, international, support et mobilite.
- Gris clair premium: fonds d'application, panneaux secondaires et etats neutres.

## Primitives

Les composants reutilisables sont dans `components/design-system/premium.tsx`.

- `PremiumPanel`: surface narrative avec texture discrete, skyline et ton par role.
- `PremiumBadge`: badge compact pour role, statut ou contexte.
- `PremiumKpi`: carte de metrique avec icone, description et barre visuelle.
- `PremiumActionCard`: action de navigation riche pour remplacer les boutons isoles.
- `PremiumStory`: bloc narratif pour introduire un parcours ou une section.
- `PremiumEmptyState`: etat vide illustre, jamais une page blanche.
- `PremiumChecklist`: garanties et etapes rassurantes.

## Tons par role

- Client: chaleureux, clair, oriente suivi et preuve.
- Livreur: dynamique, terrain, distance et mission.
- Voyageur: aerien, international, capacite et billet.
- Hub: logistique premium, controle, inventaire et lots.
- Relais: professionnel, proximite, scan et stock.
- Support: rassurant, priorite, preuves et messages.
- Admin: controle, securite, audit et performance.
- Operations: tour de controle, coordination et SLA.

## Regles d'experience

- Aucun ecran important ne doit etre vide sans illustration ou action claire.
- Les formulaires doivent conserver des labels visibles, des focus nets et des erreurs lisibles.
- Les dashboards doivent combiner KPI, action principale et timeline operationnelle.
- Les animations restent sobres: apparition, hover, loader lineaire, progression.
- Les fonds restent lisibles: textures faibles, silhouettes discretes, pas de surcharge.

## Points a poursuivre

- Ajouter des captures de reference par breakpoint.
- Connecter des visuels de destination a la ville ou au pays reel des expeditions.
- Ajouter un mode sombre complet si le produit le demande.
- Creer des tests visuels de non-regression sur les routes publiques et dashboards.
