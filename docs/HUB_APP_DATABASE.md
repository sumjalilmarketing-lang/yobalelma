# Hub App Database

Existing migrations already define the main Hub persistence model:

- `airport_hubs`
- `hub_agent_profiles`
- `operations_profiles`
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
- `hub_batches`
- `hub_batch_shipments`
- `capacity_reservations`
- `batch_documents`
- `batch_events`
- `hub_handover_events`
- `audit_log_events`
- `shipment_status_events`

Applied remote migration:

- `20260714160000_complete_hub_app_access.sql`
- `20260715010000_restore_operations_manager_hub_batch_writes.sql`

They add `hub_supervisor`, role permissions, stricter Hub route policy coverage, indexes for batch deadline and inbound tracking lookups, and restore controlled `operations_manager` writes for Hub batch orchestration used by the full international workflow.

Remote status:

- `scripts/supabase-management-migrate.mjs`: applied both Hub migrations.
- `scripts/supabase-validate.mjs`: 69 tables checked, 10 buckets checked, Auth reachable.
- Final post-corrective revalidation was blocked by the Codex approval environment, but the corrective migration apply command completed successfully.
