# Database

## Projet Supabase autorise

```text
https://rgcgtcycbiuhcaoaadbh.supabase.co
```

Toute autre URL Supabase doit etre consideree comme une erreur de configuration.

## Etat actuel

La migration initiale est `supabase/migrations/20260710140000_initial_yobalelma.sql`.

Tables :

- `profiles`
- `parcel_requests`
- `trips`
- `offers`
- `tracking_events`

Enums :

- `user_role`
- `parcel_status`
- `trip_status`
- `offer_status`
- `tracking_event_type`

## Principes

- Les migrations doivent etre atomiques, relues et versionnees.
- Les politiques RLS seront obligatoires pour les tables contenant des donnees utilisateur.
- Les types TypeScript Supabase devront etre regeneres apres creation du schema.
- Les cles de service ne doivent jamais etre exposees au navigateur.

## RLS

La migration active Row Level Security sur toutes les tables metier.

- Un profil est visible et modifiable uniquement par son proprietaire.
- Une demande de colis est modifiable par son expediteur.
- Un trajet est modifiable par son voyageur.
- Les offres sont visibles par le voyageur et l'expediteur concerne.
- Les evenements de suivi sont visibles par les participants.

## Prochaines evolutions schema

- Pieces jointes et preuves de remise.
- Verification d'identite.
- Conversations et notifications.
- Paiements et sequestre si le modele economique le demande.
