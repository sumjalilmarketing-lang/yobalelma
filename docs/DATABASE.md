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
- `supabase/migrations/20260710180000_relay_collection.sql`
- `supabase/migrations/20260710190000_traveler_hub_batches.sql`
- `supabase/migrations/20260710200000_payments_support_admin.sql`
- `supabase/migrations/20260710210000_operational_workflows_qr_storage.sql`
- `supabase/migrations/20260711110000_notifications_disputes_commissions.sql`

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
- `relay_points`
- `relay_inventory`
- `relay_scan_events`
- `collection_routes`
- `collection_route_stops`
- `traveler_documents`
- `hub_batches`
- `capacity_reservations`
- `payment_intents`
- `payouts`
- `support_tickets`
- `support_messages`
- `audit_log_events`
- `platform_metrics_daily`
- `parcel_requests`
- `trips`
- `offers`
- `tracking_events`
- `pickup_requests`
- `handover_qr_tokens`
- `collection_manifests`
- `collection_manifest_items`
- `hub_package_inspections`
- `notifications`
- `platform_commissions`
- `delivery_proofs`
- `shipment_disputes`

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
- `relay_point_status`
- `relay_scan_type`
- `relay_inventory_status`
- `collection_route_status`
- `collection_stop_status`
- `travel_document_status`
- `hub_batch_status`
- `capacity_reservation_status`
- `payment_status`
- `payout_status`
- `support_ticket_status`
- `support_priority`
- `support_category`
- `parcel_status`
- `trip_status`
- `offer_status`
- `tracking_event_type`
- `shipment_fulfillment_method`
- `pickup_request_status`
- `handover_qr_token_type`
- `handover_qr_token_status`
- `hub_inspection_decision`
- `notification_channel`
- `notification_status`
- `notification_type`
- `commission_status`
- `delivery_proof_type`
- `dispute_status`
- `dispute_category`

Storage :

- bucket prive `kyc-documents`
- bucket prive `avatars`
- bucket prive `shipment-images`
- bucket prive `flight-tickets`
- bucket prive `proof-of-delivery`
- bucket prive `dispute-evidence`
- bucket prive `hub-inspection-images`

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
- Les points relais actifs sont visibles ; leur creation et leur mise a jour sont reservees aux roles operationnels.
- Les scans relais alimentent l'inventaire, les evenements de suivi et le statut d'expedition.
- Les tournees de collecte sont visibles par leur chauffeur et les roles internes autorises.
- Les documents voyageurs sont visibles par le voyageur et les roles hub autorises.
- Les batches hub et reservations de capacite sont reserves aux roles hub et operations.
- Les paiements sandbox sont visibles par le payeur et les roles internes autorises.
- Les tickets support sont visibles par le demandeur, l'agent assigne et les roles support autorises.
- Les journaux d'audit et metriques sont reserves aux roles operations et administration.
- Une demande de colis est modifiable par son expediteur.
- Un trajet est modifiable par son voyageur.
- Les offres sont visibles par le voyageur et l'expediteur concerne.
- Les evenements de suivi sont visibles par les participants.
- Les documents d'expedition et preuves sont visibles par les participants et roles internes autorises.
- Les QR de handover sont utilisables via RPC avec hash, expiration et usage unique.
- Les inspections et inventaires hub sont reserves aux roles hub et operations.
- Les notifications sont visibles par leur destinataire, leur acteur et les roles internes autorises.
- Les commissions sont visibles par les participants financiers et les roles internes autorises.
- Les litiges sont visibles par les participants, l'assigne et les roles support/operations/admin.

## Prochaines evolutions schema

- Appliquer les migrations sur Supabase distant des que `SUPABASE_ACCESS_TOKEN` et la connexion Postgres securisee sont disponibles.
- Generer les types Supabase depuis le schema distant apres application des migrations.
- Ajouter seeds de test non sensibles pour valider les parcours reels par role.
- Brancher les providers externes : paiement, email, SMS/WhatsApp, OCR billet.
