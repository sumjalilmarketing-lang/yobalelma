# International Status Machine

## Source Of Truth

The application status machine is defined in:

`lib/international/status-machine.ts`

It maps product workflow steps to the shipment statuses currently generated in the Supabase types:

- `confirmed`
- `matching`
- `assigned`
- `picked_up`
- `at_relay`
- `collected_for_hub`
- `at_hub`
- `in_transit`
- `out_for_delivery`
- `delivered`

## Product Steps

1. Shipment created
2. Pickup or relay dropoff selected
3. Local transporter assigned
4. Picked up from sender
5. Received at origin relay
6. Stored at origin relay
7. Ready for collection
8. Loaded from relay
9. In transit to hub
10. Received at hub
11. Inspected at hub
12. Stored at hub
13. Traveler trip validated
14. Traveler capacity declared
15. Assigned to batch
16. Batch ready
17. Pickup QR generated
18. Handed to traveler
19. Destination QR generated
20. Received at destination relay
21. Ready for final delivery
22. Delivered
23. Incident opened
24. Incident resolved

## Notes

Several product steps intentionally map to the same database shipment status because the existing schema stores richer detail in adjacent tables:

- relay inventory;
- collection manifests;
- hub batches;
- capacity reservations;
- handover QR tokens;
- shipment status events;
- hub and operational incidents.

Future migrations can add more granular shipment statuses, but the current UI avoids depending on enum values that are not generated in `types/database.types.ts`.
