# International Database Flow

## Tables Read By The Workflow Cockpit

- `shipments`
- `shipment_status_events`
- `relay_inventory`
- `collection_routes`
- `collection_route_stops`
- `collection_manifests`
- `collection_manifest_items`
- `hub_batches`
- `capacity_reservations`
- `handover_qr_tokens`
- `notifications`
- `trips`
- `traveler_documents`

## Main Transitions

- Client creates a shipment through `/api/shipments`.
- Relay scans update `relay_inventory` and `shipment_status_events`.
- Collection manifest item insertion updates the shipment to `collected_for_hub`.
- Hub reception and inspection use the existing hub APIs/RPCs.
- Hub batch creation and assignment use `hub_batches` and `capacity_reservations`.
- QR generation and scanning use `handover_qr_tokens` and `scan_handover_qr_token`.
- Destination relay scan uses `/api/qr/scan` with `destination_dropoff`.

## Data Access

The workflow does not use static fixtures. It reads the connected Supabase project through server clients and respects RLS. When a policy limits a read, the cockpit displays a warning rather than pretending the data exists.

## Remaining Database Work

- Add optional granular shipment statuses for `ready_for_handover`, `arrived_destination`, and incident resolution if the product owner wants them as shipment-level enums.
- Add notification triggers for every workflow transition.
- Add query views for role-specific cockpit summaries if traffic volume grows.
