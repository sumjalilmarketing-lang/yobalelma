# Bug Fix Report

Date: 2026-07-12

## Fixes Applied During This Audit

| Bug | Cause | Files modified | Correction | Test added | Result |
| --- | --- | --- | --- | --- | --- |
| `npm run build` failed with `Cannot find module for page: /api/auth/sign-out`, `/api/auth/sign-up` or `/api/auth/forgot-password`. | Generated `.next` cache/manifests were stale or incomplete from a previous interrupted build/dev cycle. The source route files existed and compiled after cache cleanup. | Generated `.next` was removed. | Removed generated `.next` and reran `npm run build`. | No new test needed; build command verifies the route manifest. | Build passed and generated all routes. |
| Running `npm run build` and `npm run test:e2e` concurrently in the same workspace caused `.next` races. | Next build and Next dev both wrote to the same `.next` directory. | `.gitignore`, `eslint.config.mjs`, `next.config.ts`, `scripts/run-e2e.mjs`. | Added `distDir: process.env.NEXT_DIST_DIR || ".next"`, made the E2E runner use a safely cleaned `.next-e2e` directory, restored Next-generated type files after E2E, and excluded `.next-e2e` from ESLint/Git. | Existing `npm run build` and `npm run test:e2e` prove the isolation. | Build passed; E2E passed 17/17. |

## Non-Code Findings

| Finding | Status |
| --- | --- |
| Supabase REST validation succeeds. | No correction required. |
| Supabase CLI migration listing fails at PostgreSQL connection layer. | Not corrected; needs valid CLI-compatible PostgreSQL connection or Supabase dashboard intervention. |
| `.env.local` loaded correctly and ignored by Git. | No correction required. |
| No dependency vulnerabilities found. | No correction required. |

## Deferred Fixes

- Fix PostgreSQL CLI connectivity to enable `supabase migration list` and `supabase db push`.
- Add SQL-level RLS tests once CLI/database test access is available.
- Add visual smoke coverage for `/auth/sign-up`, `/auth/forgot-password` and `/auth/reset-password`.
- Add authenticated E2E fixtures for every role.
