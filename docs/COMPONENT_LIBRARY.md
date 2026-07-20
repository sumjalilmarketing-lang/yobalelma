# Bibliothèque de composants Yobalelma

Importer les composants depuis `@yobalelma/ui`.

```tsx
import { Button, YbMetric, YbStatus, YbTimeline } from "@yobalelma/ui";
```

## Composition recommandée

Une page opérationnelle commence par `YbPageHeader`, enchaîne éventuellement des `YbMetric`, puis utilise `YbCard` ou `YbTableFrame` pour le contenu. Les états sans données utilisent toujours `YbEmptyState` ; les chargements utilisent `YbLoader` ou `YbSkeleton`.

## Statuts colis

- Information / préparation : `tone="info"`
- Transit / attente : `tone="warning"`
- Conforme / livré : `tone="success"`
- Blocage / action requise : `tone="danger"`

Le libellé doit décrire une situation compréhensible par l’utilisateur, jamais un nom de table, une réponse serveur ou un code interne.

## Checklist de contribution

1. Réutiliser un composant existant avant d’en créer un.
2. Vérifier clavier, lecteur d’écran, contraste, mode sombre et mobile.
3. Fournir tous les états : repos, survol, focus, actif, chargement, désactivé, vide et erreur.
4. Employer les tokens sémantiques et l’accent du produit.
5. Ajouter ou mettre à jour la documentation et les tests concernés.
