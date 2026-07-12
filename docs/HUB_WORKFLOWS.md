# Hub Workflows

## Inbound reception

1. The hub agent opens `/dashboard/hub/inbound`.
2. The agent enters the hub id, manifest id and scanned package list.
3. The app summarizes expected, received, missing, damaged and extra packages.
4. Missing, damaged, extra, quarantined or rejected packages require a note.
5. The `receive_hub_manifest` RPC creates the receipt, receipt items, inventory movements, tracking events, incidents and audit logs.

## Inspection

1. The hub agent records measured weight, condition, packaging compliance and decision.
2. The application calculates the weight tolerance.
3. The `record_hub_inspection` RPC stores the inspection, updates inventory and creates incidents when needed.

## Storage

1. The agent assigns or moves a package to a location.
2. The `move_hub_inventory` RPC maintains a single active inventory row per shipment.
3. Every movement writes `hub_inventory_movements` and `audit_log_events`.

## Capacity and batches

1. The agent creates or opens a hub batch.
2. The agent reserves package capacity through `reserve_hub_batch_capacity_v2`.
3. The RPC locks the batch and shipment, checks destination compatibility, prevents double active batch membership and prevents capacity overflow.

## Handover

1. The agent scans or validates the QR context.
2. Identity, document and ticket checks are mandatory.
3. The `record_hub_handover_event` RPC stores proof, invalidates inventory activity and moves the batch into transit.
