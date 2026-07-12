# Hub Database

## Migration

Applied migration:

- `20260712170000_hub_backoffice_control_center.sql`

## Tables added

- `airport_hubs`
- `hub_agent_profiles`
- `operations_profiles`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `hub_zones`
- `hub_aisles`
- `hub_shelves`
- `hub_storage_locations`
- `hub_inventory`
- `hub_inventory_movements`
- `hub_inbound_receipts`
- `hub_inbound_receipt_items`
- `hub_inspections`
- `operational_incidents`
- `hub_batch_shipments`
- `batch_documents`
- `batch_events`
- `hub_handover_events`
- `system_settings`
- `feature_flags`

## RPC

- `current_user_can_access_hub`
- `get_numeric_system_setting`
- `move_hub_inventory`
- `receive_hub_manifest`
- `record_hub_inspection`
- `reserve_hub_batch_capacity_v2`
- `create_hub_incident`
- `record_hub_handover_event`

## Constraints and indexes

- One active hub inventory row per shipment.
- One active batch membership per shipment.
- One active capacity reservation per shipment.
- Hub location uniqueness by hub/code.
- Batch shipment and inventory indexes for status, destination, hub and date filters.

## Seeds

- Hub settings for weight tolerance and handover QR TTL.
- Initial airport hubs for Paris CDG and Dakar DSS.
- RBAC roles and permissions for Hub/Admin/Operations.
