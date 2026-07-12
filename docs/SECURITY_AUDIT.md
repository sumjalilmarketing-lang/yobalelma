# Security Audit

Date: 2026-07-12

## Secret Handling

Findings:

- `.env.local` exists at the project root and is loaded by `@next/env`.
- `.env`, `.env.local` and `.env.*.local` are ignored in `.gitignore`.
- `git ls-files` returned no tracked `.env` files.
- Current source secret scan, excluding `.env*`, `.next`, `node_modules` and `test-results`, returned no tracked source files containing actual secret values.
- Recent Git history scan for secret-like patterns returned only validation-script files that contain literal prefixes/regexes, not real secret values.

Risk:

- Secrets have been pasted in the conversation outside Git. If those values are live, rotate them before pilot or production.

## Environment Guards

Implemented controls:

- `lib/env.ts` requires the exact Yobalelma Supabase URL.
- Public and server env validators reject missing or malformed values.
- Supabase service role key is only read in server-side validation/service code.
- `.env.example` must remain placeholder-only and must not be used as a source of truth for local secrets.

## Authentication

Implemented controls:

- Supabase SSR clients are separated for browser and server.
- Middleware protects `/dashboard/*` and redirects anonymous users to `/auth/sign-in`.
- Auth routes exist for sign-up, sign-in, password sign-in, forgot password, reset password, sign-out and callback.
- Supabase Auth admin endpoint validated through `npm run validate:supabase`.

Remaining risks:

- Full manual browser auth flow was not completed with all test roles during this audit.
- Email confirmation and password reset depend on Supabase Auth/email configuration outside the repo.
- Middleware imports Supabase SSR in an Edge context and the production build reports a warning from `@supabase/supabase-js` about `process.version` in Edge Runtime.

## RBAC

Implemented controls:

- Platform roles: `client`, `local_transporter`, `traveler`, `relay_agent`, `hub_agent`, `collection_driver`, `operations_manager`, `support_agent`, `admin`, `super_admin`.
- Public signup roles are limited to `client`, `local_transporter`, `traveler`.
- Role dashboard mapping exists in `lib/auth/roles.ts`.
- `current_user_has_role` SQL helper is declared.
- RLS policies separate owners, participants and staff roles across tables.

Remaining risks:

- Role-to-role negative tests are not complete at SQL level because PostgreSQL CLI access is blocked.
- Admin/super admin permission boundaries need seeded authenticated E2E tests.

## API Protection

Anonymous HTTP audit:

- No static API route returned 500.
- Sensitive read routes returned 401 where expected.
- POST-only workflow routes returned 405 on GET.
- Parameterized GETs returned 400 where required context was absent.

E2E security checks:

- Dispatch endpoint does not succeed anonymously.
- QR endpoints do not expose success anonymously.
- Destination QR scan validates anonymous access.
- Payout remains blocked on incident workflow.

## Storage

Remote validation:

- 7 expected buckets exist.

Implemented controls:

- Private document buckets are modeled with owner/staff policies.
- Signed upload route exists.

Remaining risks:

- File type and size enforcement must be tested with real uploads per bucket.
- Signed URL expiry and delete permissions need authenticated role tests.

## Headers and Browser Security

Implemented controls:

- CSP header present.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- `Cross-Origin-Opener-Policy: same-origin`.
- HSTS header configured.

Risks:

- CSP currently allows `'unsafe-inline'` and `'unsafe-eval'`, which is pragmatic for the current Next.js setup but should be tightened with nonces before production.
- `Permissions-Policy` currently disables geolocation and payment. This is secure by default but must be revisited if production UX needs browser geolocation or Payment Request API.

## Security Verdict

Security foundation is good for demonstration and internal testing. It is not yet production-complete until SQL-level RLS verification, seeded role-negative tests, provider idempotency, upload policy tests and CSP hardening are completed.
