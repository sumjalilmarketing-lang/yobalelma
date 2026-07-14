# Yobalelma International Workflow

## Scope

This phase exposes the international shipment chain as an operational workflow across the existing Yobalelma monorepo:

Client -> local transporter -> origin relay -> collection driver -> hub -> traveler -> destination relay -> final delivery.

The implementation does not recreate the product architecture. It adds a shared international workflow layer on top of the existing Next.js app, Supabase tables, RBAC and RLS.

## Operational Cockpits

Created role-specific cockpits:

- `/dashboard/client/international`
- `/dashboard/transporter/international`
- `/dashboard/relay/international`
- `/dashboard/collection/international`
- `/dashboard/hub/international`
- `/dashboard/traveler/international`
- `/dashboard/admin/international`

Each cockpit reads real Supabase data visible to the connected role:

- international shipments;
- shipment status events;
- relay inventory;
- collection routes;
- collection manifests and items;
- hub batches;
- capacity reservations;
- handover QR tokens;
- notifications;
- traveler trips.

## Operational Action Routes

The workflow links to real existing actions:

- shipment creation: `/dashboard/client/shipments/new`;
- first-mile missions: `/dashboard/transporter/missions`;
- relay scanning: `/dashboard/relay/inbound`, `/dashboard/relay/outbound`, `/dashboard/relay/destination-reception`;
- collection route and manifests: `/dashboard/collection/routes`, `/dashboard/collection/manifests`;
- hub reception, inspection and handover: `/dashboard/hub/inbound`, `/dashboard/hub/inspection`, `/dashboard/hub/handover`;
- traveler trip, ticket and QR management: `/dashboard/traveler/trips/new`, `/dashboard/traveler/tickets`, `/dashboard/traveler/qr-codes`.

## New Operational Screens

- relay destination QR scan;
- relay dropoff shortcut;
- relay storage shortcut;
- relay collection cockpit;
- relay anomaly scan;
- relay tracking cockpit;
- traveler tickets;
- traveler capacity cockpit;
- traveler assignments cockpit;
- hub scanner shortcut;
- hub capacities cockpit.

## Current Product Status

The workflow is operationally visible and connected to Supabase. Some business automations still depend on existing RPCs and policies rather than a fully autonomous orchestration engine. External notifications, payment capture, payout execution and carrier integrations remain outside this phase.
