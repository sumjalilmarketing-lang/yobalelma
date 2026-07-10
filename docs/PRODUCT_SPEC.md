# Product Spec

## Produit

Yobalelma est une plateforme de livraison collaborative : une personne qui voyage peut transporter un colis pour une personne qui veut expedier quelque chose sur le meme trajet.

## Positionnement

Slogan : **Chaque voyage devient une livraison**.

Yobalelma doit rester simple, fiable et centre sur trois parcours :

- Envoyer un colis.
- Devenir livreur.
- Voyager avec Yobalelma.

## Socle livre

Le projet livre maintenant un noyau produit viable :

- application Next.js App Router ;
- landing page de marque ;
- base UI shadcn/ui ;
- validation Zod cote client et serveur ;
- formulaires React Hook Form ;
- clients Supabase serveur et navigateur ;
- connexion par lien magique Supabase ;
- profil expediteur/voyageur ;
- creation d'expedition avec adresses structurees ;
- detection national/international cote serveur ;
- estimation prix et delai ;
- code de suivi `YBL-XXXXXXXX` genere en base ;
- digital parcel twin stocke en `jsonb` ;
- publication de trajet voyageur ;
- dashboard utilisateur ;
- migration SQL initiale avec Row Level Security ;
- documentation ;
- CI GitHub Actions.

## Hors perimetre actuel

- Paiement.
- Messagerie temps reel.
- Matching avance.
- Back-office operationnel.
- Notifications.
- Gestion de litiges.

## Parcours expediteur

1. Un utilisateur se connecte par lien magique.
2. Il complete ou cree son compte.
3. Il renseigne expediteur, destinataire, adresses, colis et dates.
4. Yobalelma affiche une revue avec type de trajet, prix estime et delai.
5. L'utilisateur confirme les informations et l'absence d'objet interdit.
6. Supabase cree l'expedition, les adresses, le colis, l'evenement initial et le code de suivi.

## Parcours transport

1. Un voyageur publie un trajet.
2. Les futures phases matcheront les expeditions compatibles.
3. Les evenements de suivi alimenteront le dashboard et les notifications.

## Contraintes non negociables

- Ce depot est reserve a Yobalelma.
- Aucun code AfriCRM Shop.
- Aucun secret dans le depot.
- Un seul projet Supabase autorise : `https://rgcgtcycbiuhcaoaadbh.supabase.co`.
