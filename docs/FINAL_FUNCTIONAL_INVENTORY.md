# Final Functional Inventory

Date: 2026-07-12

| Feature | Role | Route | Tables | Status | Test | Real/Sandbox | Limitation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Client shipments | client | `/dashboard/client/shipments` | `shipments` | Functional foundation | E2E + build | Real Supabase | Authenticated seed journey pending |
| Client tracking | client/public | `/dashboard/client/tracking`, `/suivi`, `/suivi/[trackingCode]` | `shipments`, `shipment_status_events`, `delivery_proofs` | Functional foundation | Unit + E2E access | Real counters + privacy-safe public view | Authenticated seed journey pending |
| Client payments | client | `/dashboard/client/payments` | `payment_intents` | Sandbox | Unit provider tests | Sandbox/manual | Real provider absent |
| Client support/messages | client | `/dashboard/client/support`, `/dashboard/client/messages` | `support_tickets`, `support_messages` | Pilotable workspace | E2E access | Real tables | SLA workflow incomplete |
| Transporter missions | local_transporter | `/dashboard/transporter/missions/*` | `local_delivery_missions`, `delivery_proofs` | Pilotable | Unit/E2E | Real tables | Seeded mission tests pending |
| Transporter earnings | local_transporter | `/dashboard/transporter/earnings` | `payouts` | Sandbox | Unit provider tests | Sandbox/manual | Real payout absent |
| Dispatch engine | operations_manager | `/api/transporters/dispatch` | `dispatch_jobs`, `dispatch_candidates`, `dispatch_events` | Functional foundation | Build + E2E auth-denial | Real Supabase | Race-condition tests pending |
| Relay operations | relay_agent | `/dashboard/relay/*` | `relay_points`, `relay_inventory`, `relay_scan_events` | Pilotable | E2E access | Real tables | Device scanner tests pending |
| Collection operations | collection_driver | `/dashboard/collection/*` | `collection_routes`, `collection_manifests` | Pilotable | E2E access | Real tables | Full route seed pending |
| Traveler trips/tickets | traveler | `/dashboard/traveler/*` | `trips`, `traveler_documents`, `hub_batches` | Pilotable | E2E access | Real + sandbox extraction | OCR/provider absent |
| Hub operations | hub_agent | `/dashboard/hub/*` | `hub_batches`, `hub_package_inspections`, `capacity_reservations` | Pilotable | E2E access | Real tables | Full device/seed tests pending |
| QR handover/destination | traveler/hub/relay | `/api/qr/*`, `/dashboard/hub/handover` | `handover_qr_tokens` | Functional foundation | Unit + E2E | Real RPC/API + SVG QR | Authenticated device scan tests pending |
| Support/admin | support_agent/admin | `/dashboard/support`, `/dashboard/admin` | `support_tickets`, `audit_log_events` | Partial | Build/E2E access | Real tables | Full CRUD incomplete |
