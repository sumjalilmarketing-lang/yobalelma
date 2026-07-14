# Yobalelma Test Report

Date: 2026-07-14

## Commands Executed

- `eslint . --max-warnings=0`: passed.
- `tsc --noEmit`: passed.
- `vitest run`: passed, 17 files, 93 tests.
- Root Playwright E2E through `scripts/run-e2e.mjs`: passed, 83/83.
- User app Playwright E2E through `apps/user-app/scripts/run-e2e.mjs`: passed, 31/31.
- Root `next build`: passed.
- User app `next build`: passed.
- Supabase env diagnostics: passed.
- Supabase validation: passed.
- Supabase storage ensure: passed.
- Supabase RLS/security audit: passed.
- Supabase migration pending check: passed, 0 pending.

## Functional Coverage

- Authenticated role dashboards.
- Client national shipment creation.
- Traveler trip creation.
- Client/hub access denial.
- International relay dropoff, hub batching, QR handover, destination reception and OTP delivery.
- Final destination delivery screens and visual captures.
- Public tracking privacy.
- Recipient pickup OTP surfaces.
- Payout blocked evidence surfaces.
- Admin manual override surfaces.
- User-app registration, login, national shipment, international shipment, transporter, traveler, tracking, recipient and mobile responsive surfaces.

## Known Test Constraints

- Root E2E defaults to one worker because the suite uses a shared remote Supabase Auth project.
- Load tests at 100k users were not executed locally.
