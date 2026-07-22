# Audit design et expérience Yobalelma — 22 juillet 2026

## Résultat

La couche visuelle des cinq applications repose désormais sur un langage commun premium. Les écrans d'authentification et les primitives de pages métier partagent les mêmes proportions, surfaces, champs, boutons, états et règles de mouvement, tout en gardant un accent propre à chaque activité.

Le contrôle automatisé a couvert 20 combinaisons : User, Hub, Relay, Collection et Admin à 390, 768, 1440 et 3840 px. Aucun débordement horizontal, élément coupé ou texte visible sous 12 px ne subsiste sur les écrans contrôlés.

## Corrections livrées

- consolidation des tokens de couleur, rayons, ombres et espaces dans `packages/ui/src/yobalelma.css` ;
- contrôles de 48 px par défaut, avec une cible tactile minimale de 44 px ;
- focus visible, placeholders lisibles, états invalides et erreurs annoncées ;
- langage partagé pour authentification, panneaux, en-têtes de page, boutons, formulaires, tableaux, KPI, timelines, loaders et états vides ;
- refonte des accès Hub, Relay, Collection et Admin ;
- harmonisation des composants métier des trois applications opérationnelles et du centre de commandement ;
- correction de la navigation mobile User App afin de supprimer la coupure de « Mes espaces » ;
- suppression des microtextes inférieurs à 12 px sur les surfaces historiques ;
- contraste de l'orange sur fond graphite corrigé de 2,98:1 à plus de 8:1 ;
- texte blanc secondaire renforcé sur les surfaces sombres ;
- adaptation 4K et neutralisation du mouvement avec `prefers-reduced-motion` ;
- conservation des accents métier : confiance, précision, proximité, mobilité et commandement.

## Validation responsive

| Application | 390 px | 768 px | 1440 px | 3840 px |
|---|---:|---:|---:|---:|
| User App | conforme | conforme | conforme | conforme |
| Hub App | conforme | conforme | conforme | conforme |
| Relay App | conforme | conforme | conforme | conforme |
| Collection App | conforme | conforme | conforme | conforme |
| Admin App | conforme | conforme | conforme | conforme |

Critères automatisés : largeur du document, éléments hors écran, texte visible sous 12 px et rendu des formulaires. Les captures desktop et mobile sont conservées dans `docs/design-audit/2026-07-22/`.

## Accessibilité

- WCAG AA visé pour le texte et les contrôles ;
- ratio minimal 4,5:1 pour le texte courant et 3:1 pour le grand texte ;
- parcours clavier préservé, focus visible et cibles tactiles conformes ;
- libellés persistants et erreurs de formulaires annoncées ;
- support du contraste forcé et de la réduction des animations.

Le contrôle colorimétrique automatisé ne remplace pas une campagne humaine complète avec VoiceOver, NVDA et TalkBack. Cette validation spécialisée reste recommandée avant certification formelle WCAG.

## Performance visuelle

La refonte utilise du CSS, les icônes vectorielles déjà présentes et le logo partagé. Elle n'ajoute aucune bibliothèque d'animation, aucune image distante ni JavaScript décoratif. Les animations sont limitées aux transformations et à l'opacité et sont désactivées à la demande du système.

## Validation technique

- `npm run lint` : réussi, zéro avertissement ;
- `npm run typecheck` : réussi en mode strict ;
- `npm run test` : 37 fichiers et 182 tests réussis ;
- build racine : réussi, 76 pages générées, JavaScript partagé de 102 kB ;
- builds isolés User, Hub, Relay, Collection et Admin : tous réussis ;
- JavaScript initial partagé des applications isolées : 103 kB ;
- `git diff --check` : réussi.

## Preuves

- `docs/design-audit/2026-07-22/before/` : état de référence avant harmonisation ;
- `docs/design-audit/2026-07-22/after/` : rendus desktop et mobile après harmonisation ;
- `docs/DESIGN_SYSTEM.md` : contrat d'interface 2.0 et gouvernance.

## Risque résiduel

Aucun blocage visuel n'a été observé sur les écrans et largeurs contrôlés. Une certification d'accessibilité indépendante et des essais sur appareils physiques restent les étapes adaptées avant de revendiquer une conformité exhaustive sur tous les matériels et lecteurs d'écran.
