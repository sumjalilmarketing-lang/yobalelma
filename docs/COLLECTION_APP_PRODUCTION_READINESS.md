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
- Production E2E desktop, mobile, and tablet: 7 passed, 2 intentionally skipped outside the mobile project.
- 28 driver pages audited against the HTTPS production deployment on desktop, mobile, and tablet: pass.
- Manager settings access and driver denial: pass.
- Visual demonstration capture generation from production: 10/10 pass.
- Real Supabase Auth/RLS/RPC security suite: pass (driver isolation, manager and operations-manager visibility, client/anonymous denial, GPS ownership, direct-assignment denial, offline idempotency, conflict resolution).
- Supabase platform validation: Auth 200, 69 baseline tables and 10 Storage buckets checked without failure.
- Controlled production load test: 100 requests at concurrency 20, 0 failures, 303 ms average, 944 ms p95.
- Production health: HTTP 200, 31 routes, Supabase `ok`, optimizer enabled, offline enabled.
- Security headers: CSP present, HSTS `max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: DENY`.

## Demonstration evidence

Screenshots generated from the HTTPS production deployment are stored in `docs/visual-demo/collection-app/` for dashboard, missions, navigation, scanner, inventory, vehicle, AI anomalies, offline mode, mobile, and tablet.

## Deployment

Collection App is deployed on Vercel at <https://yobalelma-collection.vercel.app> from production commit `face877`.

- Build status: Ready (Next.js production build completed in 1 min 28 s).
- Required runtime variables are configured for Production and Preview; no Supabase service-role key is exposed to the application runtime.
- Supabase Auth redirect URLs include the Collection origin, sign-in, callback, and password-reset paths. The existing Hub `site_url` remains unchanged.
- Permanent HTTPS domain: `yobalelma-collection.vercel.app`; the initial Vercel domain redirects to it.
