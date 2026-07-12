# Hub Security

## Supabase project

The project validated is:

- `https://rgcgtcycbiuhcaoaadbh.supabase.co`

No secret value is stored in this document.

## RLS

RLS was verified remotely for the new Hub and RBAC tables. Every checked table has RLS enabled and at least one select/write policy.

## RBAC model

- `hub_agent` can operate only on assigned hubs.
- `operations_manager` can supervise managed hubs and countries.
- `admin` can administer platform operations.
- `super_admin` alone can modify critical permissions and feature flags.
- `support_agent` receives read access only where needed.

## Storage

Private buckets validated:

- `avatars`
- `shipment-images`
- `kyc-documents`
- `flight-tickets`
- `proof-of-delivery`
- `dispute-evidence`
- `hub-inspection-images`
- `hub-incident-evidence`
- `batch-documents`
- `handover-proofs`

## Remaining security work

- Add production-grade audit review screens.
- Add object-level Storage policies for every bucket path.
- Add MFA policy for admin and super admin accounts before production.
