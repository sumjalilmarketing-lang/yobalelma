# Final Completion Plan

Date: 2026-07-12
Branch: `codex/finish-yobalelma`

## Terminated Or Pilotable

- Public landing and acquisition routes.
- Auth pages and Supabase Auth wiring.
- Role dashboards for client, local transporter, traveler, relay, collection, hub, operations, support and admin.
- Shipment creation foundation with server-side national/international detection.
- Private tracking foundations through `shipment_status_events`.
- Local transporter profile, vehicle, zones, availability and mission actions.
- Relay scan, inventory and outbound foundations.
- Collection routes, manifests and scanner foundations.
- Traveler trips, ticket sandbox extraction, capacity and QR list foundations.
- Hub inbound, inventory, batches, handover and trip views.
- QR handover and destination scan RPC/API foundations.
- Support, disputes, delivery proofs, notifications, commissions and payout models.
- Sandbox/manual payment and payout provider boundary.
- RBAC permission catalogue and UI guards.
- E2E runner isolated from production `.next` artifacts.

## Partial

- Authenticated role-by-role E2E with seeded users.
- KYC decision back-office.
- Admin/super-admin CRUD for settings, pricing, roles and integrations.
- Storage upload/read/delete tests per role and bucket.
- Public tracking page with privacy filtering.
- Dispatch engine runtime using new dispatch tables.
- Full state machine enforcement across all shipment transitions.

## Visual Or Skeleton Remaining

- Some newly exposed role subsections are operational workspaces with real Supabase counters and guards, not full CRUD screens yet.
- QR image rendering/printing is not complete.
- Admin analytics are still basic.

## Broken

- No reproducible source/build/test bug remains after the `.next-e2e` fix.

## Not Connected Or Blocked

- Supabase CLI PostgreSQL connection still blocks migration history verification and remote push of the new dispatch migration.
- Orange Money, Wave and card providers are not connected because partner contracts/secrets are absent.
- External email/SMS/WhatsApp notifications are not connected.

## Exact Finalization Order

1. Fix PostgreSQL CLI access and apply pending non-destructive dispatch migration.
2. Seed test accounts for every role.
3. Execute authenticated RBAC negative tests.
4. Complete public tracking page and privacy filter.
5. Complete Storage upload flows and bucket policy tests.
6. Complete QR image rendering and scanner device tests.
7. Complete admin/super-admin CRUD.
8. Integrate real payment/notification providers or approve manual pilot mode.
9. Run load/race tests on dispatch, QR scan, capacity reservation and payout transitions.
10. Freeze pilot checklist and production runbooks.

