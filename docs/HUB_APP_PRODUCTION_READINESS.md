# Hub App Production Readiness

## Deployment

The Hub is deployed on Vercel at <https://yobalelma-hub.vercel.app> from the
`codex/hub-enterprise-upgrade` branch. The Vercel monorepo build runs the
`@yobalelma/hub-app` workspace and publishes `apps/hub-app/.next`.

Supabase Auth uses the Yobalelma project
`https://rgcgtcycbiuhcaoaadbh.supabase.co`. The production origin and its Auth
callback, sign-in and reset-password URLs are present in the Supabase allow
list.

## Validation (2026-07-18)

- Vercel production build: green.
- HTTPS health endpoint: `status: ok`, Supabase: `ok`, 27 Hub routes reported.
- Environment variables: Yobalelma Supabase URL and keys, service role,
  production app URL, pilot password and Hub session secret configured for
  Production and Preview.
- Real Supabase sessions: `hub_agent`, `hub_supervisor` and `hub_manager`
  validated; a non-Hub account is denied.
- Security validation: RLS denies unauthorized writes and RPC calls, protected
  documents are not exposed, capacity and QR replay protections pass.
- Route audit: all 27 static Hub pages render through the production HTTPS
  origin with a real manager session.
- E2E pilot: 2/2 scenarios pass, including inbound receipt, scanning,
  inspection, inventory movement, capacity, batch, pickup QR, traveler
  handover, anomalies, notifications, profile and responsive views.
- Local regression: lint and strict TypeScript pass; 4 test files and 23 tests
  pass.
- HTTP hardening: CSP, HSTS and `X-Frame-Options` are present.

## Demonstration evidence

The production-backed screenshots are stored in
`docs/visual-demo/hub-app-staging/` (sign-in plus desktop, mobile and tablet
workflow views).

## Operational follow-up

The deployed Hub is ready for a controlled pilot. Before increasing public
traffic, add an explicit distributed rate limiter and external alert routing;
Vercel runtime logs and observability remain the current operational baseline.
