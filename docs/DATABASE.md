# Database

## Projet Supabase autorise

```text
https://rgcgtcycbiuhcaoaadbh.supabase.co
```

Toute autre URL Supabase doit etre consideree comme une erreur de configuration.

## Etat actuel

Aucune table metier definitive n'est creee dans cette phase. Le dossier `supabase/migrations/` est reserve aux futures migrations SQL Yobalelma.

## Principes

- Les migrations doivent etre atomiques, relues et versionnees.
- Les politiques RLS seront obligatoires pour les tables contenant des donnees utilisateur.
- Les types TypeScript Supabase devront etre regeneres apres creation du schema.
- Les cles de service ne doivent jamais etre exposees au navigateur.

## Prochain schema probable

Les prochaines phases pourront introduire :

- profils utilisateurs ;
- trajets voyageurs ;
- demandes d'envoi ;
- colis ;
- offres de transport ;
- statuts et audit minimal ;
- pieces jointes si necessaire.

