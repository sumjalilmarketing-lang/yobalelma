# User App Staging Test Report

Date: 2026-07-14

## Target

- URL: `https://sum-funny-lakes-won.trycloudflare.com`
- App: `apps/user-app`
- Mode: production build served by `next start`, exposed through Cloudflare Quick Tunnel.

## Commands Run

- `node scripts/next-with-root-env.mjs build`
- `node node_modules/vitest/vitest.mjs run tests/security.test.ts`
- `node node_modules/eslint/bin/eslint.js apps/user-app/middleware.ts lib/auth/redirect.ts tests/security.test.ts --max-warnings=0`
- `PLAYWRIGHT_BASE_URL=https://sum-funny-lakes-won.trycloudflare.com PLAYWRIGHT_SKIP_WEBSERVER=1 USER_APP_VISUAL_DEMO_DIR=docs/visual-demo/user-app-staging node scripts/run-e2e.mjs --workers=1`
- `node scripts/supabase-validate.mjs`

## Results

- Targeted security tests: 9 passed / 0 failed.
- Targeted lint: passed with 0 warnings.
- User-app build: passed, 54 routes generated.
- Staging E2E: 31 passed / 0 failed.
- Supabase validation: Auth OK, 69 tables OK, 10 private buckets OK.

## Routes Tested

- `/`
- `/how-it-works`
- `/security`
- `/pricing`
- `/tracking`
- `/relay-points`
- `/prohibited-items`
- `/support`
- `/terms`
- `/privacy`
- `/auth/login`
- `/auth/register`
- `/recipient/delivery`
- `/client`
- `/client/shipments`
- `/client/shipments/new`
- `/transporter`
- `/transporter/missions`
- `/traveler`
- `/traveler/trips/new`

## Workflows Tested

- Public landing pages.
- Protected route redirects.
- Client registration form.
- Password login with Supabase test user.
- National shipment creation.
- International shipment detection.
- Multi-role switching.
- Transporter mission workspace.
- Traveler trip publication and capacity.
- Recipient delivery surfaces.
- Public tracking privacy check.
- Mobile overflow check.

## Bugs Fixed

- Staging protected routes redirected to `https://localhost:43121/auth/login`.
- Supabase auth callback URL construction used a local `NEXT_PUBLIC_APP_URL` even when the request arrived from an external forwarded host.
- Cloudflare quick tunnel instability under parallel E2E was mitigated by using HTTP/2 and `--workers=1`.
