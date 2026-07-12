# Operations Control Center

## Routes

- `/dashboard/operations/shipments`
- `/dashboard/operations/dispatch`
- `/dashboard/operations/collections`
- `/dashboard/operations/relays`
- `/dashboard/operations/hubs`
- `/dashboard/operations/trips`
- `/dashboard/operations/batches`
- `/dashboard/operations/anomalies`
- `/dashboard/operations/performance`
- `/dashboard/operations/live-map`
- `/dashboard/operations/notifications`

## Delivered behavior

Each operations section is protected by role and permission, reads Supabase counters and exposes action cards to related modules.

## Remaining behavior

- Real-time map subscriptions.
- Corrective action wizard.
- SLA breach detection jobs.
- Assignment optimization.
- Escalation notification delivery through email/SMS/WhatsApp providers.
