# User App Routes

All routes below are physically present in `apps/user-app` and were included in the independent user-app build.

## Public

- `/` - functional
- `/how-it-works` - functional
- `/security` - functional
- `/pricing` - functional
- `/tracking` - functional
- `/tracking/[trackingCode]` - functional
- `/relay-points` - functional
- `/prohibited-items` - functional
- `/support` - functional
- `/terms` - functional
- `/privacy` - functional
- `/recipient/delivery` - functional, depends on existing final delivery orders for full data
- `/recipient/delivery/[shipmentId]` - functional, depends on an existing shipment/final delivery order

## Auth

- `/auth/login` - functional
- `/auth/register` - functional
- `/auth/forgot-password` - functional
- `/auth/reset-password` - functional after a valid Supabase reset session
- `/auth/callback` - functional

Compatibility redirects:

- `/auth/sign-in` redirects to `/auth/login`.
- `/auth/sign-up` redirects to `/auth/register`.
- `/dashboard/client` redirects to `/client`.
- `/dashboard/transporter` redirects to `/transporter`.
- `/dashboard/traveler` redirects to `/traveler`.
- `/suivi` redirects to `/tracking`.

## Client

- `/client` - functional
- `/client/shipments` - functional
- `/client/shipments/new` - functional
- `/client/shipments/[id]` - functional with existing shipment
- `/client/tracking` - functional
- `/client/payments` - functional sandbox/manual view
- `/client/addresses` - functional operational view
- `/client/messages` - functional operational view
- `/client/support` - functional
- `/client/profile` - functional
- `/client/notifications` - functional

## Local Transporter / Tiak-Tiak

- `/transporter` - functional
- `/transporter/missions` - functional
- `/transporter/missions/available` - functional
- `/transporter/missions/active` - functional
- `/transporter/missions/history` - functional
- `/transporter/missions/[id]` - functional with existing mission
- `/transporter/availability` - functional
- `/transporter/zones` - functional
- `/transporter/vehicle` - functional
- `/transporter/earnings` - functional sandbox/manual view
- `/transporter/ratings` - functional operational view
- `/transporter/kyc` - functional
- `/transporter/support` - functional
- `/transporter/profile` - functional
- `/transporter/notifications` - functional

## Traveler

- `/traveler` - functional
- `/traveler/kyc` - functional
- `/traveler/trips` - functional
- `/traveler/trips/new` - functional
- `/traveler/trips/[id]` - functional with existing trip
- `/traveler/tickets` - functional
- `/traveler/capacity` - functional
- `/traveler/assignments` - functional
- `/traveler/qr-codes` - functional
- `/traveler/earnings` - functional sandbox/manual view
- `/traveler/payments` - functional sandbox/manual view
- `/traveler/history` - functional
- `/traveler/support` - functional
- `/traveler/profile` - functional
- `/traveler/notifications` - functional

## API

User-app exposes route handlers for auth, profiles, shipments, transporter operations, trips, travel documents, payments sandbox, notifications, support, storage signed upload, QR handover/scan, KYC, disputes, commissions and health check.
