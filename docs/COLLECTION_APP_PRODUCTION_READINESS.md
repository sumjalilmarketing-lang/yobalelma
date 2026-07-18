# Collection App Production Readiness

## Scope

Collection App is the standalone Yobalelma application for internal transporters. It covers freight movements from relay points to hubs and from hubs to other hubs, airports, ports, and distribution centers. It intentionally excludes collection at a client's home and final-mile delivery.

## Implemented product

- Driver dashboard, mission board, planning, automatic assignment, route optimization, GPS, and turn-by-turn navigation.
- QR and barcode scanning, truck loading/unloading, quantity and batch controls, inventory, package photos, and electronic signatures.
- History, incidents, AI anomaly detection, notifications, secure messaging, support, profile, and settings.
- Vehicle status, inspections, maintenance, mileage, fuel, driver documents, and vehicle documents.
- Offline-first operation queue, idempotent replay, automatic synchronization, PWA manifest, and service worker.
- French, English, Spanish, German, Italian, Portuguese, Arabic, Russian, and Simplified Chinese through the shared localization layer, including time zones, currencies, dates, RTL, and local unit systems.
- Responsive desktop, tablet, and mobile layouts, light/dark themes, reduced-motion support, keyboard focus, semantic headings, labels, and mobile navigation.

## Intelligence

The deterministic and auditable routing layer provides nearest-stop ordering, distance estimates, delay risk, forgotten-package detection, quantity anomalies, grouping signals, and capacity-aware assignment recommendations. It remains usable offline and can be replaced by a hosted optimizer without changing the UI contracts.

## Security

- Supabase Auth with `collection_driver`, `collection_manager`, and `operations_manager` access.
- RLS isolates drivers to assigned routes and vehicles; managers can plan and resolve conflicts; client and anonymous access return no operational rows.
- Security-definer RPCs validate ownership for GPS and package movements.
- Zod request validation, same-origin CSRF checks, HMAC sessions, opaque HttpOnly cookies, idempotency keys, rate limiting, structured/redacted logs, and full audit events.
- CSP, HSTS, `X-Frame-Options`, content-type protection, referrer policy, and browser permissions restrictions use the shared Yobalelma security baseline.
- Offline operations are append-only for drivers; only managers and authorized operations roles can resolve them.

## Supabase

Applied migrations:

- `20260718183000_collection_app_complete.sql`
- `20260718190000_collection_security_fix.sql`
- `20260718191000_collection_manager_permissions.sql`

The Yobalelma project is exclusively `https://rgcgtcycbiuhcaoaadbh.supabase.co`. Real pilot accounts and a realistic Dakar relay-to-hub route, assigned vehicle, and three relay stops are provisioned. No password is stored in Git.

## Validation completed on 2026-07-18

- ESLint: pass, zero warnings.
- TypeScript strict: pass.
- Next.js production build: pass.
- Unit/integration: 9/9 pass.
- Core E2E desktop, mobile, and tablet: pass.
- 28 driver pages audited on desktop, mobile, and tablet: pass.
- Manager settings access and driver denial: pass.
- Visual regression capture generation: 10/10 pass.
- Real Supabase Auth/RLS/RPC security suite: pass (driver isolation, manager visibility, client/anonymous denial, GPS ownership, direct-assignment denial, offline idempotency, conflict resolution).
- Supabase platform validation: Auth 200, 69 baseline tables and 10 Storage buckets checked without failure.

## Demonstration evidence

Screenshots are stored in `docs/visual-demo/collection-app/` for dashboard, missions, navigation, scanner, inventory, vehicle, AI anomalies, offline mode, mobile, and tablet.

## Deployment

Vercel production URL, environment verification, Supabase Auth redirect URLs, real HTTPS login, remote E2E, security headers, health check, and remote load-test results are completed during the deployment phase and recorded in the final delivery.
