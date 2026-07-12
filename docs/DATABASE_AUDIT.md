# Database Audit

Date: 2026-07-12

## Supabase Project Boundary

Expected project URL: `https://rgcgtcycbiuhcaoaadbh.supabase.co`

Verification:

- `lib/env.ts` rejects any other Supabase URL.
- `scripts/supabase-validate.mjs` validates only project ref `rgcgtcycbiuhcaoaadbh`.
- `npm run validate:supabase` succeeded against the expected project.

No secret values are documented here.

## Migration Files

| File | Purpose |
| --- | --- |
| `20260710140000_initial_yobalelma.sql` | Base collaborative parcel/trip schema. |
| `20260710152000_auth_roles_kyc.sql` | Auth profile roles, KYC and private KYC storage. |
| `20260710152100_normalize_public_roles.sql` | Public role normalization and auth trigger update. |
| `20260710160000_shipments.sql` | Structured shipments, addresses, packages and shipment RPC. |
| `20260710170000_local_transporters.sql` | Local transporters, vehicles, zones, availability and missions. |
| `20260710180000_relay_collection.sql` | Relay points, relay inventory and collection route schema. |
| `20260710190000_traveler_hub_batches.sql` | Traveler documents, hub batches and capacity reservations. |
| `20260710200000_payments_support_admin.sql` | Sandbox payments, payouts, support, audit log and metrics. |
| `20260710210000_operational_workflows_qr_storage.sql` | Pickup requests, QR handover, manifests, inspections and Storage buckets. |
| `20260711110000_notifications_disputes_commissions.sql` | Notifications, commissions, delivery proofs and disputes. |

## Local Schema Inventory

| Object type | Count |
| --- | ---: |
| Migration files | 10 |
| Public tables | 41 |
| Enums | 44 |
| SQL/RPC functions | 23 |
| Triggers | 30 |
| Indexes | 56 |
| RLS policies | 117 |
| Storage buckets declared | 7 |

## Tables

`audit_log_events`, `capacity_reservations`, `collection_manifest_items`, `collection_manifests`, `collection_route_stops`, `collection_routes`, `delivery_proofs`, `handover_qr_tokens`, `hub_batches`, `hub_package_inspections`, `identity_verification_decisions`, `identity_verification_documents`, `identity_verifications`, `local_delivery_missions`, `notifications`, `offers`, `parcel_requests`, `payment_intents`, `payouts`, `pickup_requests`, `platform_commissions`, `platform_metrics_daily`, `profiles`, `relay_inventory`, `relay_points`, `relay_scan_events`, `role_assignments`, `shipment_addresses`, `shipment_disputes`, `shipment_packages`, `shipment_status_events`, `shipments`, `support_messages`, `support_tickets`, `tracking_events`, `transporter_availability`, `transporter_profiles`, `transporter_vehicles`, `transporter_zones`, `traveler_documents`, `trips`.

## Enums

`account_status`, `capacity_reservation_status`, `collection_route_status`, `collection_stop_status`, `commission_status`, `delivery_proof_type`, `dispute_category`, `dispute_status`, `handover_qr_token_status`, `handover_qr_token_type`, `hub_batch_status`, `hub_inspection_decision`, `identity_decision`, `identity_document_kind`, `identity_document_type`, `identity_verification_status`, `local_delivery_mission_status`, `notification_channel`, `notification_status`, `notification_type`, `offer_status`, `package_category`, `parcel_status`, `payment_status`, `payout_status`, `pickup_request_status`, `relay_inventory_status`, `relay_point_status`, `relay_scan_type`, `shipment_address_type`, `shipment_fulfillment_method`, `shipment_scope`, `shipment_service_level`, `shipment_status`, `support_category`, `support_priority`, `support_ticket_status`, `tracking_event_type`, `transporter_availability_status`, `transporter_status`, `travel_document_status`, `trip_status`, `user_role`, `vehicle_type`.

## RPC and Functions

`accept_local_delivery_mission`, `calculate_platform_commission`, `create_handover_qr_token`, `create_local_delivery_mission`, `create_notification`, `create_operational_shipment`, `create_sandbox_payment_intent`, `create_shipment`, `create_shipment_dispute`, `create_support_ticket`, `current_user_has_role`, `dispatch_local_delivery_missions`, `find_local_transporter_matches`, `generate_tracking_code`, `handle_new_user`, `hash_handover_token`, `mark_notification_read`, `progress_local_delivery_mission`, `record_delivery_proof`, `record_relay_scan`, `reserve_batch_capacity`, `scan_handover_qr_token`, `set_updated_at`.

## Storage Buckets

Remote REST validation confirms these 7 buckets exist:

- `avatars`
- `shipment-images`
- `kyc-documents`
- `flight-tickets`
- `proof-of-delivery`
- `dispute-evidence`
- `hub-inspection-images`

Private document buckets are modeled through Storage policies. `avatars` has a public-read policy.

## Remote Supabase Validation

`npm run validate:supabase` result:

- Auth admin endpoint: OK, HTTP 200.
- Tables checked: 41.
- Table failures: 0.
- Buckets checked: 7.
- Bucket failures: 0.
- Credential source: environment.

This proves the expected Yobalelma Supabase project is reachable by REST and contains the expected table/bucket surface.

## Migration Application Status

During this audit, migrations were not pushed because:

- `npx supabase migration list --db-url ...` failed with a PostgreSQL client connection error.
- TCP to the configured pooler host and port succeeds.
- The failure therefore appears to be at the PostgreSQL connection/auth/driver layer, not at `.env.local` loading and not at general HTTPS Supabase access.

No destructive migration was executed. No remote data was deleted.

Because CLI migration history could not be queried, exact remote migration history order is not proven. The REST validation proves the expected resulting tables and buckets exist.

## RLS and Security Rules

Local migrations declare:

- RLS enabled for all domain tables created by the migrations.
- Owner/staff/participant policies for profiles, shipments, KYC, transporter resources, relay resources, hub resources, support, notifications, proofs, disputes and payouts.
- Role-aware helper `current_user_has_role(required_roles text[])`.
- Audit logging around key operations such as payments, QR token generation/scans and disputes.

Remote migration history is linked and aligned through `20260712120000`. Anonymous HTTP/E2E tests confirm sensitive API operations do not anonymously succeed; full SQL-level role-by-role RLS tests with seeded users remain to be added.

## Database Risks

- PostgreSQL CLI connection must be fixed before a pilot so migration history and policy catalog can be directly verified.
- RLS should get SQL-level negative tests for each role once CLI access works.
- Payment and payout state transitions need provider idempotency keys before production.
- QR token scan paths should be load/race tested with concurrent scans.
- Some indexes are present, but production-scale pagination/search indexes should be revisited after real query plans are available.
