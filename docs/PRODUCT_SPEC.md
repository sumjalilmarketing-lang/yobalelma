# Product Spec

## Produit

Yobalelma est une plateforme de livraison collaborative : une personne qui voyage peut transporter un colis pour une personne qui veut expedier quelque chose sur le meme trajet.

## Positionnement

Slogan : **Chaque voyage devient une livraison**.

Yobalelma doit rester simple, fiable et centre sur trois parcours :

- Envoyer un colis.
- Devenir livreur.
- Voyager avec Yobalelma.

## MVP actuel

Cette phase livre un noyau produit viable :

- application Next.js App Router ;
- landing page de marque ;
- base UI shadcn/ui ;
- validation Zod cote client et serveur ;
- formulaires React Hook Form ;
- clients Supabase serveur et navigateur ;
- connexion par lien magique Supabase ;
- profil expediteur/voyageur ;
- demande d'envoi de colis ;
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
- Verification d'identite avancee.
- Gestion de litiges.

## Parcours MVP

1. Un utilisateur se connecte par lien magique.
2. Il complete son profil.
3. Il publie une demande d'envoi ou un trajet.
4. Le dashboard affiche ses donnees rattachees a son compte.
5. Les offres et evenements de suivi sont prevus dans le schema Supabase.

## Contraintes non negociables

- Ce depot est reserve a Yobalelma.
- Aucun code AfriCRM Shop.
- Aucun secret dans le depot.
- Un seul projet Supabase autorise : `https://rgcgtcycbiuhcaoaadbh.supabase.co`.
