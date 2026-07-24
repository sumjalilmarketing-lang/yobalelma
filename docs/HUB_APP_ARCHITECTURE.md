# Hub App Architecture

`apps/hub-app` is an independent Next.js App Router application for `hub.yobalelma.com`.

## Runtime

- App Router with TypeScript strict mode.
- Independent `package.json`, `next.config.ts`, `tsconfig.json`, Tailwind config, middleware, Vitest and Playwright config.
- Root `.env.local` is loaded through `scripts/next-with-root-env.mjs`.
- Official Yobalelma brand assets are copied under `apps/hub-app/public/brand`.

## Layers

- `app/`: routes, API handlers and protected Hub surface.
- `src/lib/`: Supabase Auth resolution, signed demo sessions, permissions, live Hub reads and mutations, i18n and operational store.
- `src/components/`: shell, navigation, reusable panels and workflow pages.
- `tests/`: unit/integration tests and E2E specs.
- `supabase/migrations/20260714160000_complete_hub_app_access.sql`: Hub supervisor role and access policies.

## Data Model

The UI consumes a request-scoped Hub state. For a real Supabase Hub session, `live-hub-data.ts` loads the authenticated Hub data under RLS and validates row shapes with Zod before mapping them to the UI model. Write APIs call live Supabase RPC/table paths. Read failures are surfaced through the App Router error boundary and never replaced with demo data.

Signed demo sessions intentionally use the mutable local store for offline demonstrations and E2E fixtures. That store models manifests, shipments, inspections, inventory, trips, capacities, batches, QR tokens, handovers, anomalies, notifications, tracking and audit logs, but is not used as the read source for real Supabase sessions.
