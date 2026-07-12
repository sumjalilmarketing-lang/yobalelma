# Functional Inventory

Date: 2026-07-12

Status vocabulary:

- Tested: covered by unit/E2E/HTTP audit in this phase.
- Partially tested: route or validation tested, but full authenticated workflow not completed.
- Present, not fully tested: code and schema exist, but the end-to-end role journey was not completed.
- Sandbox/model: domain model exists without live external provider.
- Missing production integration: feature needs a third-party service, operator tooling or test data before production.

## Client

| Feature | Route/API | Tables | Status | Notes |
| --- | --- | --- | --- | --- |
| Signup and login | `/auth/sign-up`, `/auth/sign-in`, `/api/auth/*` | `profiles`, `role_assignments` | Partially tested | Pages and APIs build; Supabase Auth admin endpoint OK. Full user browser journey not completed. |
| Dashboard | `/dashboard/client` | `shipments`, `parcel_requests`, `trips`, `offers` | Partially tested | Protected redirect verified anonymously. |
| KYC request | `/dashboard/client/kyc`, `/api/kyc` | `identity_verifications`, `identity_verification_documents`, `identity_verification_decisions` | Present, not fully tested | Storage bucket present; human decision workflow incomplete. |
| Shipment creation | `/dashboard/client/shipments/new`, `/api/shipments` | `shipments`, `shipment_addresses`, `shipment_packages`, `shipment_status_events`, `pickup_requests` | Partially tested | Shipment schemas and E2E workflow tests pass; authenticated browser write not manually completed. |
| National/international detection | shipment validation and RPC payload | `shipments` | Tested | Covered by unit tests and E2E workflow tests. |
| Tracking history | `/dashboard/client/shipments/[id]` | `shipment_status_events`, `tracking_events` | Present, not fully tested | Private tracking exists; public tracking page not present. |
| Support and disputes | `/support`, `/api/support/*`, `/api/disputes` | `support_tickets`, `support_messages`, `shipment_disputes` | Partially tested | Public support surface tested; authenticated support workflow not completed. |

## Local Transporter / Tiak-Tiak

| Feature | Route/API | Tables | Status | Notes |
| --- | --- | --- | --- | --- |
| Transporter profile | `/dashboard/transporter`, `/api/transporters/profile` | `transporter_profiles` | Present, not fully tested | Protected route verified; authenticated save not manually completed. |
| Vehicle | `/dashboard/transporter/vehicle`, `/api/transporters/vehicles` | `transporter_vehicles` | Present, not fully tested | Schema validation present. |
| Zones | `/dashboard/transporter/zones`, `/api/transporters/zones` | `transporter_zones` | Present, not fully tested | Endpoint method protection verified. |
| Availability | `/dashboard/transporter/availability`, `/api/transporters/availability` | `transporter_availability` | Present, not fully tested | Role guard required for real usage. |
| Missions | `/dashboard/transporter/missions`, `/api/transporters/missions` | `local_delivery_missions`, `pickup_requests`, `shipments` | Partially tested | Anonymous access blocked; dispatch E2E workflows pass. |
| Accept/progress delivery | `/api/transporters/missions/[id]` | `local_delivery_missions`, `shipment_status_events`, `delivery_proofs`, `payouts` | Partially tested | RPCs exist; dynamic route requires seeded mission. |

## Traveler

| Feature | Route/API | Tables | Status | Notes |
| --- | --- | --- | --- | --- |
| Traveler dashboard | `/dashboard/traveler` | `trips`, `traveler_documents`, `capacity_reservations` | Present, not fully tested | Protected redirect verified. |
| Trip creation | `/dashboard/traveler/trips/new`, `/api/trips` | `trips` | Partially tested | Public traveler page and E2E international workflow pass. |
| Flight ticket upload/extraction | `/api/travel-documents`, `FlightTicketExtractor` | `traveler_documents` | Sandbox/model | No real OCR/provider validation. |
| Capacity declaration | `/dashboard/traveler/trips/[id]` | `trips`, `capacity_reservations` | Present, not fully tested | Requires seeded trip. |
| QR codes | `/dashboard/traveler/qr-codes`, `/api/qr/*` | `handover_qr_tokens`, `hub_batches` | Partially tested | QR endpoint security and workflow tests pass; rendered QR image not complete. |

## Relay Point

| Feature | Route/API | Tables | Status | Notes |
| --- | --- | --- | --- | --- |
| Relay dashboard | `/dashboard/relay` | `relay_points`, `relay_inventory`, `relay_scan_events` | Present, not fully tested | Protected redirect verified. |
| Inbound scan | `/dashboard/relay/inbound`, `/api/relay/scans` | `relay_inventory`, `relay_scan_events`, `shipment_status_events` | Present, not fully tested | Endpoint method protection verified. |
| Inventory | `/dashboard/relay/inventory` | `relay_inventory` | Present, not fully tested | Needs seeded relay data. |
| Outbound handover | `/dashboard/relay/outbound` | `collection_manifests`, `collection_manifest_items` | Present, not fully tested | Needs collection route seed. |
| Scanner | `/dashboard/relay/scanner` | `handover_qr_tokens`, `relay_scan_events` | Present, not fully tested | QR scanner workflow not manually completed. |

## Collection

| Feature | Route/API | Tables | Status | Notes |
| --- | --- | --- | --- | --- |
| Collection dashboard | `/dashboard/collection` | `collection_routes`, `collection_route_stops` | Present, not fully tested | Protected redirect verified. |
| Route planning | `/dashboard/collection/routes`, `/api/collection/routes` | `collection_routes`, `collection_route_stops` | Present, not fully tested | POST-only API protects GET. |
| Route detail | `/dashboard/collection/routes/[id]`, `/api/collection/routes/[id]` | `collection_routes`, `collection_route_stops` | Present, not fully tested | Dynamic route needs seeded route. |
| Manifest | `/dashboard/collection/manifests`, `/api/collection/manifests` | `collection_manifests`, `collection_manifest_items` | Present, not fully tested | POST-only API protects GET. |
| Scanner | `/dashboard/collection/scanner` | `collection_manifests`, `relay_scan_events` | Present, not fully tested | Needs authenticated operator and seeded route. |

## Hub

| Feature | Route/API | Tables | Status | Notes |
| --- | --- | --- | --- | --- |
| Hub dashboard | `/dashboard/hub` | `hub_batches`, `hub_package_inspections`, `capacity_reservations` | Present, not fully tested | Protected redirect verified. |
| Inbound reception | `/dashboard/hub/inbound`, `/api/hub/inspections` | `hub_package_inspections`, `shipments` | Present, not fully tested | POST-only API protects GET. |
| Inventory | `/dashboard/hub/inventory` | `shipments`, `hub_package_inspections` | Present, not fully tested | Needs hub seed data. |
| Trip assignment | `/dashboard/hub/trips`, `/api/hub/assignments` | `trips`, `capacity_reservations` | Present, not fully tested | Capacity reservation RPC exists. |
| Batch creation | `/dashboard/hub/batches`, `/api/hub/batches` | `hub_batches`, `capacity_reservations` | Partially tested | E2E international workflow covers batch foundations. |
| Handover | `/dashboard/hub/handover`, `/api/qr/handover` | `handover_qr_tokens`, `audit_log_events` | Partially tested | QR handover E2E workflow passes. |

## Operations, Support and Admin

| Feature | Route/API | Tables | Status | Notes |
| --- | --- | --- | --- | --- |
| Operations dashboard | `/dashboard/operations` | many operational tables | Present, not fully tested | Protected redirect verified. |
| Support dashboard | `/dashboard/support` | `support_tickets`, `support_messages`, `shipment_disputes` | Present, not fully tested | Full assignment/SLA workflow not complete. |
| Admin dashboard | `/dashboard/admin` | `profiles`, `role_assignments`, `platform_metrics_daily`, `audit_log_events` | Present, not fully tested | No complete production CRUD for all settings. |
| Super admin | `/dashboard/admin` | `role_assignments`, `audit_log_events` | Present, not fully tested | Role exists; full permission matrix needs seeded tests. |

## Payments and Payouts

| Feature | Route/API | Tables | Status | Notes |
| --- | --- | --- | --- | --- |
| Payment intent | `/api/payments/intents` | `payment_intents` | Sandbox/model | RPC `create_sandbox_payment_intent`; no live provider. |
| Commissions | `/api/commissions` | `platform_commissions` | Partially tested | Anonymous GET blocked; calculation RPC exists. |
| Payouts | mission/QR RPCs | `payouts`, `platform_commissions` | Sandbox/model | Payout blocking on incident covered by E2E workflow; no real payout rail. |
