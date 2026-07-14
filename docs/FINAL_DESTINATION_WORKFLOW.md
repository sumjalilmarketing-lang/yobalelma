# Final Destination Workflow

Date: 2026-07-14

## Scope

This phase finalizes the last mile of the international flow:

1. Destination relay receives the traveler batch.
2. Relay confirms each expected package.
3. Package is stored in destination inventory.
4. Recipient chooses relay pickup or home delivery.
5. OTP is generated and verified server-side.
6. Proof of delivery is recorded.
7. Shipment is closed as delivered.
8. Traveler and final driver payout eligibility is updated.
9. Manual corrections are audited.

## Implemented Routes

- `/relay/destination-reception`
- `/relay/destination-reception/[batchId]`
- `/relay/inventory`
- `/relay/inventory/[shipmentId]`
- `/relay/final-delivery`
- `/relay/final-delivery/[shipmentId]`
- `/relay/scanner`
- `/relay/anomalies`
- `/relay/tracking`
- `/relay/history`
- `/recipient/delivery`
- `/recipient/delivery/[shipmentId]`
- `/tracking/[trackingCode]`
- `/client/shipments/[id]`
- `/client/notifications`
- `/client/support`
- `/admin/manual-corrections`
- `/admin/manual-corrections/[id]`
- `/admin/delivery-overrides`
- `/admin/otp-events`
- `/admin/proof-of-delivery`
- `/admin/payout-review`
- `/admin/audit-logs`

## Server Workflows

- `confirm_destination_batch_reception` receives a batch, creates final delivery orders, stores relay inventory, records checks, and emits notifications.
- `set_final_delivery_choice` switches between relay pickup and home delivery with audit metadata.
- `generate_delivery_otp`, `verify_delivery_otp`, and `revoke_delivery_otp` secure the recipient handover.
- `create_final_mile_delivery_mission` creates a `relay_to_recipient` local mission.
- `record_final_delivery_attempt` records absence, invalid address, refusal, blocked delivery, and rescheduling events.
- `admin_manual_delivery_override` applies audited delivery overrides.

## Current Readiness

- Ready for demo: yes.
- Ready for internal test: yes.
- Ready for pilot: partial, only with sandbox/manual payment and notification providers.
- Ready for production: no, external payment and notification providers still need real integration and live operational validation.
