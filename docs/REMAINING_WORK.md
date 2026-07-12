# Remaining Work

Date: 2026-07-12

## Critical

- Fix PostgreSQL CLI connectivity for the configured Supabase database.
- Run `supabase migration list` and `supabase db push` only after CLI connection is proven and non-destructive migration plan is clear.
- Generate seeded test users for all roles: client, local transporter, traveler, relay agent, collection driver, hub agent, operations manager, support agent, admin and super admin.
- Execute authenticated E2E workflows for every role.
- Add SQL-level RLS negative tests for cross-user and cross-role access.
- Rotate any live secrets that were pasted outside Git before pilot.

## High

- Add real Storage upload/download/delete tests for avatars, shipment images, KYC documents, flight tickets, delivery proofs, dispute evidence and hub inspections.
- Add printable/scannable QR image rendering around existing opaque QR token workflows.
- Add public tracking by tracking code with privacy-safe data exposure.
- Complete KYC back-office decisions and audit trail UX.
- Complete flight ticket validation beyond sandbox extraction.
- Integrate production payment and payout provider(s), or explicitly define a no-payment pilot.
- Integrate external notifications: email, SMS and WhatsApp.
- Complete admin/super-admin CRUD for roles, permissions, KYC, pricing, payouts, disputes and settings.

## Medium

- Add pagination, search, filters and exports on operational lists.
- Add full empty/loading/error states for authenticated dashboard data.
- Add observability dashboards and alerting.
- Harden CSP with nonce-based scripts when feasible.
- Review and resolve the Supabase SSR Edge Runtime warning before production.
- Add load/race tests for dispatch, QR scan, batch capacity and payout idempotency.
- Add component tests for complex forms.

## Low

- Add visual smoke tests for all auth pages.
- Add i18n beyond the French-first experience.
- Add PDF shipping labels, manifests and operator exports.
- Add operator guides for relay, collection and hub teams.
- Add onboarding/help content for each role after product flows stabilize.
