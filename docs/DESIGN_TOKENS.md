# Tokens Yobalelma

## Tokens sémantiques

| Token | Rôle |
|---|---|
| `--primary` | Action principale et signature orange |
| `--background` | Toile générale |
| `--card` / `--surface` | Surfaces élevées |
| `--foreground` | Texte principal |
| `--muted` / `--muted-foreground` | Hiérarchie secondaire |
| `--border` / `--input` / `--ring` | Séparation et focus |
| `--success` / `--warning` / `--error` / `--info` | États métier |
| `--yb-product-accent` | Repère du produit actif |
| `--yb-product-soft` / `--yb-product-ink` | Surfaces et textes d’accent |

## Activation d’un thème

Le layout de chaque application place `data-yb-product` sur `body` : `user`, `hub`, `relay`, `collection` ou `admin`. Le mode sombre est activé par la classe `dark` sur `html`.

## Usage

Préférer les classes Tailwind sémantiques (`bg-card`, `text-foreground`, `border-border`) ou `hsl(var(--token))`. Ne jamais utiliser une couleur d’état pour une décoration sans rapport avec cet état.
