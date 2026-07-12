# Route Classification

## User App

Public and external-user routes:

- `/`
- `/envoyer`
- `/livreur`
- `/voyager`
- `/suivi`
- `/suivi/[trackingCode]`
- `/support`
- `/auth/sign-in`
- `/auth/sign-up`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/callback`
- `/dashboard`
- `/dashboard/client`
- `/dashboard/client/[section]`
- `/dashboard/client/kyc`
- `/dashboard/client/shipments`
- `/dashboard/client/shipments/new`
- `/dashboard/client/shipments/[id]`
- `/dashboard/transporter`
- `/dashboard/transporter/[section]`
- `/dashboard/transporter/availability`
- `/dashboard/transporter/vehicle`
- `/dashboard/transporter/zones`
- `/dashboard/transporter/missions`
- `/dashboard/transporter/missions/available`
- `/dashboard/transporter/missions/active`
- `/dashboard/transporter/missions/history`
- `/dashboard/transporter/missions/[id]`
- `/dashboard/traveler`
- `/dashboard/traveler/[section]`
- `/dashboard/traveler/kyc`
- `/dashboard/traveler/qr-codes`
- `/dashboard/traveler/trips`
- `/dashboard/traveler/trips/new`
- `/dashboard/traveler/trips/[id]`
- `/dashboard/kyc`

APIs:

- `/api/auth/*`
- `/api/profile`
- `/api/shipments`
- `/api/parcel-requests`
- `/api/payments/intents`
- `/api/transporters/*`
- `/api/trips`
- `/api/travel-documents`
- `/api/kyc`

## Hub App

Routes:

- `/dashboard/hub`
- `/dashboard/hub/[section]`
- `/dashboard/hub/inbound`
- `/dashboard/hub/inbound/[id]`
- `/dashboard/hub/inspection`
- `/dashboard/hub/inventory`
- `/dashboard/hub/storage`
- `/dashboard/hub/batches`
- `/dashboard/hub/batches/new`
- `/dashboard/hub/batches/[id]`
- `/dashboard/hub/handover`
- `/dashboard/hub/trips`
- `/dashboard/hub/trips/[id]`
- `/dashboard/hub/anomalies`

APIs:

- `/api/hub/advanced-inspections`
- `/api/hub/anomalies`
- `/api/hub/assignments`
- `/api/hub/batches`
- `/api/hub/batches/[id]`
- `/api/hub/handover-events`
- `/api/hub/inbound`
- `/api/hub/inspections`
- `/api/hub/storage`
- `/api/qr/handover`
- `/api/qr/scan`

## Collection App

Routes:

- `/dashboard/collection`
- `/dashboard/collection/[section]`
- `/dashboard/collection/routes`
- `/dashboard/collection/routes/[id]`
- `/dashboard/collection/manifests`
- `/dashboard/collection/scanner`

APIs:

- `/api/collection/routes`
- `/api/collection/routes/[id]`
- `/api/collection/manifests`

## Relay App

Routes:

- `/dashboard/relay`
- `/dashboard/relay/[section]`
- `/dashboard/relay/inbound`
- `/dashboard/relay/inventory`
- `/dashboard/relay/outbound`
- `/dashboard/relay/scanner`

APIs:

- `/api/relay/points`
- `/api/relay/scans`

## Admin App

Routes:

- `/dashboard/admin`
- `/dashboard/admin/[section]`
- `/dashboard/operations`
- `/dashboard/operations/[section]`
- `/dashboard/support`

APIs:

- `/api/commissions`
- `/api/disputes`
- `/api/delivery-proofs`
- `/api/notifications`
- `/api/support/messages`
- `/api/support/tickets`

## Shared

- `app/layout.tsx`
- `app/globals.css`
- `app/not-found.tsx`
- `middleware.ts`
- `/api/storage/signed-upload`

## Obsolete

None in phase 1.

## Uncertain

- Generic dashboard shell routes remain shared until each app receives its dedicated layout.
- Some support and notification APIs may be split between user-app and admin-app after ticket workflow audit.
