# Five Apps Audit

## Current State

Yobalelma is currently a single Next.js App Router application hosted at the repository root. It contains public marketing pages, public tracking, authentication, client dashboards, local transporter dashboards, traveler dashboards, hub logistics, relay, collection, operations, support and admin back-office.

No existing route has been deleted in this phase. The root app remains the validated legacy host while the repository evolves into a five-application monorepo.

## Target Applications

| App | Target domain | Primary roles | Migration status |
| --- | --- | --- | --- |
| `user-app` | `app.yobalelma.com` | `client`, `local_transporter`, `traveler` | Planned |
| `hub-app` | `hub.yobalelma.com` | `hub_agent`, `hub_manager` | Planned |
| `collection-app` | `collecte.yobalelma.com` | `collection_driver`, `collection_manager` | Planned |
| `relay-app` | `relais.yobalelma.com` | `relay_agent`, `relay_manager` | Planned |
| `admin-app` | `admin.yobalelma.com` | `operations_manager`, `support_agent`, `finance_agent`, `admin`, `super_admin` | Planned |

## Component Classification

| Area | Classification | Notes |
| --- | --- | --- |
| `components/ui/*` | shared | Moved behind `@yobalelma/ui` exports. |
| `components/design-system/*` | shared | Shared premium UI language. |
| `components/brand/*` | shared | Shared official logo and brand assets. |
| `components/layout/*` | shared | Reused during transition, later split per app. |
| `components/forms/shipment-form.tsx` | user-app | Client shipment creation. |
| `components/forms/transporter-operations-form.tsx` | user-app | Local transporter workflows. |
| `components/forms/trip-form.tsx` | user-app | Traveler trip workflows. |
| `components/forms/travel-document-form.tsx` | user-app | Traveler documents and ticket flows. |
| `components/forms/hub-forms.tsx` | hub-app | Hub batch/capacity. |
| `components/forms/hub-operations-forms.tsx` | hub-app | Hub reception, inspection, storage, anomalies, handover. |
| `components/forms/relay-forms.tsx` | relay-app | Relay scan and inventory operations. |
| `components/forms/operations-forms.tsx` | admin-app | Payment and internal operations forms. |
| `components/dashboard/*` | shared/admin-app | Shared operational shell, later split per app. |
| `components/operations/*` | shared/internal apps | Generic operation forms and status panels. |
| `components/tracking/*` | user-app/shared | Public/private tracking. |
| `components/visual/*` | shared | Visual identity system. |

## Service And Library Classification

| Source | Classification | Notes |
| --- | --- | --- |
| `lib/auth/*` | shared | Exported through `@yobalelma/auth`; single auth model. |
| `lib/supabase/*` | shared | Exported through `@yobalelma/database`; single Supabase backend. |
| `lib/validation/*` | shared | Exported through `@yobalelma/validation`. |
| `lib/hub/workflows.ts` | shared/hub-app | Exported through `@yobalelma/business-rules`. |
| `lib/shipments/*` | user-app/shared | Shipment pricing and estimation. |
| `lib/tracking/*` | user-app/shared | Public and private tracking. |
| `lib/qr/*` | shared | QR payload rules. |
| `lib/payments/*` | admin-app/shared | Payment provider abstraction. |
| `lib/dashboard/*` | admin-app/shared | Transition workspace config. |
| `lib/security/*` | shared | Security headers for every app. |

## API Classification

| API prefix | Classification |
| --- | --- |
| `/api/auth/*` | shared/user-app |
| `/api/profile` | shared/user-app |
| `/api/shipments`, `/api/parcel-requests`, `/api/payments/intents` | user-app |
| `/api/transporters/*` | user-app |
| `/api/trips`, `/api/travel-documents` | user-app |
| `/api/hub/*` | hub-app |
| `/api/collection/*` | collection-app |
| `/api/relay/*` | relay-app |
| `/api/qr/*` | shared, used by hub-app, relay-app and user-app traveler space |
| `/api/support/*`, `/api/disputes`, `/api/commissions`, `/api/notifications` | admin-app/shared |
| `/api/storage/signed-upload` | shared |

## Database And Migrations

All migrations remain under the single shared Supabase backend:

- `supabase/migrations/20260710140000_initial_yobalelma.sql`
- `supabase/migrations/20260710152000_auth_roles_kyc.sql`
- `supabase/migrations/20260710152100_normalize_public_roles.sql`
- `supabase/migrations/20260710160000_shipments.sql`
- `supabase/migrations/20260710170000_local_transporters.sql`
- `supabase/migrations/20260710180000_relay_collection.sql`
- `supabase/migrations/20260710190000_traveler_hub_batches.sql`
- `supabase/migrations/20260710200000_payments_support_admin.sql`
- `supabase/migrations/20260710210000_operational_workflows_qr_storage.sql`
- `supabase/migrations/20260711110000_notifications_disputes_commissions.sql`
- `supabase/migrations/20260712120000_dispatch_engine_foundation.sql`
- `supabase/migrations/20260712170000_hub_backoffice_control_center.sql`
- `supabase/migrations/20260712200000_five_apps_roles.sql`

## Test Classification

| Tests | Classification |
| --- | --- |
| `tests/shipment.test.ts`, `tests/public-tracking.test.ts`, `tests/transporter.test.ts` | user-app |
| `tests/hub.test.ts` | hub-app/shared business rules |
| `tests/relay.test.ts` | relay-app |
| `tests/operations.test.ts`, `tests/rbac.test.ts`, `tests/security.test.ts` | admin-app/shared |
| `tests/e2e/national-delivery.spec.ts`, `tests/e2e/international-shipment.spec.ts` | user-app |
| `tests/e2e/hub-*.spec.ts` | hub-app |
| `tests/e2e/admin-*.spec.ts`, `tests/e2e/operations-*.spec.ts` | admin-app |
| `tests/five-apps-architecture.test.ts` | monorepo architecture |

## Obsolete Or Uncertain

No file is marked obsolete in phase 1. Uncertain files are the shared dashboard shell and generic operations components; they remain shared until each app receives its own complete layout and navigation.
