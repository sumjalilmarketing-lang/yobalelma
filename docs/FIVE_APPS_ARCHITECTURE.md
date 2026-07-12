# Five Apps Architecture

## Repository Layout

```text
yobalelma/
  apps/
    user-app/
    hub-app/
    collection-app/
    relay-app/
    admin-app/
  packages/
    ui/
    auth/
    database/
    types/
    validation/
    business-rules/
    tracking/
    qr/
    notifications/
    config/
  supabase/
    migrations/
    functions/
    seed/
```

## Monorepo Tool

The project now uses npm workspaces. This keeps the existing package manager and avoids introducing a new tool before it is necessary.

## Shared Backend

All five apps use the same Supabase project:

- `https://rgcgtcycbiuhcaoaadbh.supabase.co`

The backend is shared for auth, profiles, roles, permissions, shipments, tracking, relay operations, collection operations, hub operations, payments, notifications and audits.

## Shared Packages

| Package | Responsibility |
| --- | --- |
| `@yobalelma/ui` | Shared UI primitives and premium design system. |
| `@yobalelma/auth` | Roles, permissions and app-access policy. |
| `@yobalelma/database` | Supabase database types and typed RPC helpers. |
| `@yobalelma/types` | Shared TypeScript domain types. |
| `@yobalelma/validation` | Zod schemas shared by APIs and forms. |
| `@yobalelma/business-rules` | Shipment, hub, payment and operational business rules. |
| `@yobalelma/tracking` | Public/private tracking helpers. |
| `@yobalelma/qr` | QR payload rules. |
| `@yobalelma/notifications` | Notification channel contract. |
| `@yobalelma/config` | App manifests, domains and route ownership. |

## Transition Principle

The root Next.js application is not removed. It remains the stable host while each route is migrated into the correct app with tests and build validation.

No business rule should be duplicated in app folders. Shared logic must move into `packages/*` first, then apps consume it.
