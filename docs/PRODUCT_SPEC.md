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
- profil transporteur local avec vehicules, zones et disponibilites ;
- matching deterministe pour missions nationales ;
- points relais, inventaire et scans colis ;
- tournees de collecte modelisees ;
- documents voyageurs, batches hub, reservations de capacite et payload QR ;
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
2. Un transporteur local declare son profil, ses vehicules, ses zones et ses disponibilites.
3. Les expeditions nationales peuvent etre comparees aux transporteurs compatibles.
4. Un agent relais scanne les colis avec le code de suivi.
5. Les scans alimentent l'inventaire et les statuts d'expedition.
6. Un agent hub cree un batch et reserve la capacite d'expeditions compatibles.
7. Les futures phases brancheront paiements, notifications et back-office complet.

## Contraintes non negociables

- Ce depot est reserve a Yobalelma.
- Aucun code AfriCRM Shop.
- Aucun secret dans le depot.
- Un seul projet Supabase autorise : `https://rgcgtcycbiuhcaoaadbh.supabase.co`.
