# Remaining Risks

Date: 2026-07-12

## Critical

- PostgreSQL CLI connection to Supabase fails, so migration history and RLS catalog cannot be directly verified with `supabase migration list` / `db push`.
- Full authenticated role-by-role browser workflows were not completed with seeded test users.
- Production payment providers are not integrated; payments and payouts remain sandbox/model foundations.
- Secrets pasted outside Git should be rotated before pilot if they are live.

## High

- SQL-level RLS negative tests are missing for client, local transporter, traveler, relay, collection, hub, support, admin and super admin roles.
- Storage upload/read/delete policies need real authenticated tests per bucket.
- QR handover/destination scans need concurrent usage and replay-attack tests.
- Admin and super admin permission boundaries need complete CRUD/negative tests.
- External notification providers are not wired.
- Public tracking by tracking code is not present.

## Medium

- Edge Runtime warning from Supabase SSR middleware should be evaluated before production.
- CSP allows `'unsafe-inline'` and `'unsafe-eval'`; replace with nonce-based CSP when feasible.
- Operational lists need pagination, filters, search and empty/loading/error state tests with real data volume.
- KYC and flight ticket validation are not complete production back-office workflows.
- Observability, alerting, audit review dashboards and incident runbooks are not complete.

## Low

- Add visual smoke tests for all auth pages, not only sign-in.
- Add i18n beyond current French-first surfaces.
- Add PDF labels/manifests and export tooling.
- Add operator documentation for relay, hub and collection teams.
