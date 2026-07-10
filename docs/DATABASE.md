# Database

## Projet Supabase autorise

```text
https://rgcgtcycbiuhcaoaadbh.supabase.co
```

Toute autre URL Supabase doit etre consideree comme une erreur de configuration.

## Etat actuel

Migrations locales :

- `supabase/migrations/20260710140000_initial_yobalelma.sql`
- `supabase/migrations/20260710152000_auth_roles_kyc.sql`
- `supabase/migrations/20260710152100_normalize_public_roles.sql`
- `supabase/migrations/20260710160000_shipments.sql`
- `supabase/migrations/20260710170000_local_transporters.sql`

Tables :

- `profiles`
- `role_assignments`
- `identity_verifications`
- `identity_verification_documents`
- `identity_verification_decisions`
- `shipments`
- `shipment_addresses`
- `shipment_packages`
- `shipment_status_events`
- `transporter_profiles`
- `transporter_vehicles`
- `transporter_zones`
- `transporter_availability`
- `local_delivery_missions`
- `parcel_requests`
- `trips`
- `offers`
- `tracking_events`

Enums :

- `user_role`
- `account_status`
- `identity_verification_status`
- `identity_document_type`
- `identity_document_kind`
- `identity_decision`
- `shipment_scope`
- `shipment_status`
- `shipment_service_level`
- `shipment_address_type`
- `package_category`
- `transporter_status`
- `vehicle_type`
- `transporter_availability_status`
- `local_delivery_mission_status`
- `parcel_status`
- `trip_status`
- `offer_status`
- `tracking_event_type`

Storage :

- bucket prive `kyc-documents`

## Principes

- Les migrations doivent etre atomiques, relues et versionnees.
- Les politiques RLS seront obligatoires pour les tables contenant des donnees utilisateur.
- Les types TypeScript Supabase devront etre regeneres apres creation du schema.
- Les cles de service ne doivent jamais etre exposees au navigateur.

## RLS

Les migrations activent Row Level Security sur toutes les tables metier sensibles.

- Un profil est visible et modifiable uniquement par son proprietaire.
- Les profils sont lisibles par les roles internes autorises.
- Les affectations de roles sont gerees par les administrateurs.
- Les verifications KYC sont visibles par le proprietaire et les equipes autorisees.
- Les documents KYC sont relies au bucket prive `kyc-documents`.
- Une expedition est visible et modifiable par son expediteur avant prise en charge.
- Les adresses, colis et evenements d'expedition sont accessibles via policies parent-enfant.
- Les profils transporteurs actifs sont consultables pour le matching local.
- Les vehicules, zones et disponibilites sont modifiables par leur proprietaire.
- Les missions locales sont visibles par l'expediteur, le transporteur et les roles internes autorises.
- Une demande de colis est modifiable par son expediteur.
- Un trajet est modifiable par son voyageur.
- Les offres sont visibles par le voyageur et l'expediteur concerne.
- Les evenements de suivi sont visibles par les participants.

## Prochaines evolutions schema

- Pieces jointes et preuves de remise.
- Conversations et notifications.
- Paiements et sequestre si le modele economique le demande.
- Matching expeditions-voyages internationaux.
- Paiements et preuves de remise.
