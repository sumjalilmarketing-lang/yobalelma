# Yobalelma Design System

Version 1.0 — référence officielle de l’écosystème Yobalelma.

## Principe de marque

Le symbole officiel représente une route en mouvement. Le système en dérive trois règles : une ligne orange guide toujours l’action, les surfaces graphite donnent de l’autorité aux espaces opérationnels, et les fonds ivoire maintiennent une perception humaine et rassurante.

La personnalité recherchée est « précise, chaleureuse, en mouvement ». Toute interface doit rester identifiable sans dépendre du nom du produit.

## Architecture

- `packages/ui/src/yobalelma.css` : tokens, thèmes, accessibilité, motifs, mouvement et classes structurelles.
- `components/ui/` : primitives interactives communes.
- `components/design-system/yobalelma.tsx` : composants de composition officiels.
- `components/design-system/premium.tsx` : composants historiques compatibles pendant la migration.
- `components/brand/yobalelma-logo.tsx` : point d’entrée unique pour le logo.
- `/design-system` dans User App : catalogue visuel de référence.

Les applications importent uniquement `@yobalelma/ui`. Aucun nouveau composant partagé ne doit être copié dans une application.

## Personnalités produit

| Produit | Intention | Accent fonctionnel | Usage |
|---|---|---|---|
| User App | Simple et rassurant | Bleu confiance | suivi, création, paiement |
| Hub App | Haute performance | Cyan précision | contrôle, stock, anomalies |
| Relay App | Proximité efficace | Vert service | réception, stockage, remise |
| Collection App | Mobilité rapide | Violet mouvement | missions, scan, navigation |
| Admin App | Commandement international | Orange marque | gouvernance, décision, audit |

L’accent métier ne remplace jamais l’orange de marque pour l’action principale.

## Fondations

### Couleur

Les couleurs sont des tokens HSL et ne doivent pas être codées directement dans un composant métier. Les états sont sémantiques : `success`, `warning`, `error`, `info`. Un statut ne doit jamais être communiqué par la couleur seule : il conserve un libellé et, si utile, une icône.

### Typographie

La pile système optimisée garantit performance et cohérence cross-platform. Les titres utilisent une graisse 830–850, un crénage serré et une longueur contrôlée. Le corps reste à 14–16 px, avec une hauteur de ligne de 1,6 à 1,7.

### Espacement et forme

La grille repose sur 4 px. Espacements courants : 8, 12, 16, 20, 24, 32, 40, 56 et 80 px. Les rayons sémantiques vont de 10 px pour un contrôle à 28 px pour une grande surface de marque.

### Icônes

Lucide est la grammaire fonctionnelle. Taille standard : 16 px dans un contrôle, 20 px dans une navigation, 24 px dans un état. Les icônes décoratives portent `aria-hidden`.

### Mouvement

Les transitions d’interface durent 150–200 ms. Les révélations durent au maximum 460 ms. Le mouvement indique une relation spatiale ou une progression et ne doit jamais retarder une action. `prefers-reduced-motion` neutralise automatiquement les animations.

## Composants officiels

- `Button`, `Input`, `Select`, `Textarea`
- `YbPageHeader`, `YbCard`, `YbMetric`
- `YbStatus`, `YbNotice`, `YbEmptyState`
- `YbTimeline`, `YbTableFrame`
- `YbLoader`, `YbSkeleton`
- `YobalelmaLogo`

Les dialogues et menus doivent s’appuyer sur Radix UI pour le focus trap, la fermeture clavier et les attributs ARIA, puis recevoir les surfaces `yb-card` et les tokens du système.

## Règles d’accessibilité

- Contraste WCAG AA minimum : 4,5:1 pour le texte courant et 3:1 pour le texte large.
- Zone tactile minimale de 44 × 44 px.
- Focus visible sur toute interaction clavier.
- Libellé persistant pour chaque champ ; un placeholder n’est pas un libellé.
- Erreurs placées près du champ, expliquées en langage utilisateur et annoncées avec `role="alert"`.
- Tableaux débordants accessibles au clavier via `YbTableFrame`.
- Support du mode sombre, du contraste forcé et de la réduction des animations.

## Responsive

Mobile d’abord. Les KPI passent de 1 à 2 puis 4 colonnes. Les sidebars deviennent navigation basse ou tiroir. Les tableaux conservent leur structure et deviennent défilables horizontalement. Aucun contenu critique ne dépend du survol.

## Gouvernance

Toute évolution de token ou de primitive doit être réalisée dans `packages/ui` ou `components/`, documentée ici, puis validée sur les cinq applications. Une dérogation locale doit être justifiée dans une décision d’architecture sous `docs/`.
