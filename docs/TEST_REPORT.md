# Test Report

Date: 2026-07-12

## Commands Executed

| Command | Result |
| --- | --- |
| `npm install` | Passed, dependencies already up to date. |
| `npm run diagnose:env` | Passed, `.env.local` exists and required Supabase variables are loaded by `@next/env`. |
| `npm run validate:supabase` | Passed after network escalation, Auth OK, 41 tables OK, 7 buckets OK. |
| `npx supabase migration list --db-url ...` | Failed, PostgreSQL client connection error. No secrets displayed. |
| `npm run lint` | Passed. |
| `npm run typecheck` | Passed. |
| `npm run test` | Initial sandbox run blocked by Windows folder permission; rerun outside sandbox passed. |
| `npm run build` | Initial run failed due stale/shared `.next`; passed after cleanup and E2E dist isolation. |
| `npm run test:e2e` | Initial concurrent run failed due shared `.next`; passed after `.next-e2e` isolation. |
| `npm audit --audit-level=moderate` | Passed after network escalation, 0 vulnerabilities. |

## Unit Tests

Result:

- Test files: 9 passed.
- Tests: 47 passed.

Covered areas:

- Environment validation.
- Shipment validation and national/international detection.
- Transporter validation.
- Relay validation.
- Hub validation.
- Operations validation.
- Product schemas.
- Security validation.
- Yobalelma intent validation.

## E2E Tests

Result:

- Tests: 17 passed.

Covered areas:

- Landing page CTAs and responsive layout.
- Public routes `/envoyer`, `/voyager`, `/livreur`, `/support`, `/auth/sign-in`.
- Dashboard protection surface.
- National delivery workflow foundation.
- International shipment workflow foundation.
- Dispatch anonymous protection and reassignment workflow.
- QR handover endpoint security and workflow.
- Destination QR scan anonymous protection.
- Payout blocked on incident workflow.

## HTTP Route Audit

Pages:

- 43 non-dynamic pages tested over HTTP.
- Public pages returned 200.
- Protected dashboards returned 307 redirects.
- Remaining 5 page routes are dynamic and require seeded IDs.

APIs:

- 37 non-dynamic route handlers tested with anonymous GET.
- No route returned 500.
- Responses were expected 405, 401, 400 or 307 depending on method/auth/query requirements.
- Remaining 3 API route handlers are dynamic and require seeded IDs.

## Skipped Tests

No automated tests were reported as skipped in the final successful `npm run test:e2e` execution.

The following manual verifications remain unexecuted because they require seeded authenticated users and/or provider configuration:

- Full client signup through confirmed email flow.
- Full role-by-role browser sessions.
- Real file upload/download/delete against Storage buckets.
- Real payment provider transaction.
- Full PostgreSQL migration history comparison through Supabase CLI.

## Final Test Verdict

The automated suite is clean. Remaining risk is not automated test failure; it is lack of authenticated seeded production-like scenarios and SQL-level role-by-role policy tests.
