# Final Mile Delivery

Date: 2026-07-14

## Implemented

- Delivery mode can be set to `home_delivery`.
- RPC `create_final_mile_delivery_mission` creates a local mission of type `relay_to_recipient`.
- The mission links to `final_delivery_orders`.
- Final driver payout eligibility is set when OTP/proof confirms home delivery.
- Failure attempts can record absence, invalid address, refusal, blocked delivery, reschedule, and return-to-relay states.

## Driver Information Model

The final mile mission exposes only operationally necessary data:

- relay pickup context;
- shipment identifier;
- package weight/status;
- destination delivery context;
- instructions;
- payout eligibility state.

## Validated Surfaces

- `/dashboard/relay/final-delivery`
- `/dashboard/relay/final-delivery/[shipmentId]`
- `/recipient/delivery`
- `/recipient/delivery/[shipmentId]`

## Remaining Production Work

- Real map/navigation provider.
- Driver mobile app hardening for offline/retry mode.
- Real geolocation consent capture.
- SLA and dispatch optimization for high-volume cities.
