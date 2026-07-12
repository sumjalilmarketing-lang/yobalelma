# Back-office Implementation

## Admin routes

The following routes are available through the dynamic admin workspace:

- `/dashboard/admin/users`
- `/dashboard/admin/roles`
- `/dashboard/admin/permissions`
- `/dashboard/admin/kyc`
- `/dashboard/admin/transporters`
- `/dashboard/admin/travelers`
- `/dashboard/admin/collection-drivers`
- `/dashboard/admin/relay-networks`
- `/dashboard/admin/relay-points`
- `/dashboard/admin/hubs`
- `/dashboard/admin/hub-users`
- `/dashboard/admin/shipments`
- `/dashboard/admin/dispatch`
- `/dashboard/admin/collections`
- `/dashboard/admin/trips`
- `/dashboard/admin/batches`
- `/dashboard/admin/inventory`
- `/dashboard/admin/anomalies`
- `/dashboard/admin/payments`
- `/dashboard/admin/payouts`
- `/dashboard/admin/disputes`
- `/dashboard/admin/support`
- `/dashboard/admin/audit`
- `/dashboard/admin/settings`
- `/dashboard/admin/pricing`
- `/dashboard/admin/notifications`
- `/dashboard/admin/analytics`
- `/dashboard/admin/reports`
- `/dashboard/admin/integrations`
- `/dashboard/admin/feature-flags`
- `/dashboard/admin/system-health`

## Implementation level

These routes are connected control-center pages with RBAC, Supabase counters, actions, checkpoints and empty states. They are not yet full CRUD consoles for every entity. Critical mutations such as real payment refunds, payout releases and KYC final decisions must remain blocked until providers and internal procedures are confirmed.
