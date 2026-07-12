# User App Routes

## Publiques

- `/`
- `/how-it-works`
- `/security`
- `/pricing`
- `/tracking`
- `/tracking/[trackingCode]`
- `/relay-points`
- `/prohibited-items`
- `/support`
- `/terms`
- `/privacy`

## Auth

- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/callback`

Compatibilite:

- `/auth/sign-in` redirige vers `/auth/login`.
- `/auth/sign-up` redirige vers `/auth/register`.

## Client

- `/client`
- `/client/shipments`
- `/client/shipments/new`
- `/client/shipments/[id]`
- `/client/tracking`
- `/client/payments`
- `/client/addresses`
- `/client/messages`
- `/client/support`
- `/client/profile`
- `/client/notifications`

## Livreur local

- `/transporter`
- `/transporter/missions`
- `/transporter/missions/available`
- `/transporter/missions/active`
- `/transporter/missions/history`
- `/transporter/missions/[id]`
- `/transporter/availability`
- `/transporter/zones`
- `/transporter/vehicle`
- `/transporter/earnings`
- `/transporter/ratings`
- `/transporter/kyc`
- `/transporter/support`
- `/transporter/profile`
- `/transporter/notifications`

## Voyageur

- `/traveler`
- `/traveler/kyc`
- `/traveler/trips`
- `/traveler/trips/new`
- `/traveler/trips/[id]`
- `/traveler/tickets`
- `/traveler/capacity`
- `/traveler/assignments`
- `/traveler/qr-codes`
- `/traveler/earnings`
- `/traveler/payments`
- `/traveler/history`
- `/traveler/support`
- `/traveler/profile`
- `/traveler/notifications`

## API user-app

Wrappers physiques presents pour auth, profile, shipments, pickup/dispatch, transporters, trips, documents, tracking auxiliaire, support, notifications, payments sandbox et QR.
