# Yobalelma Security Report

Date: 2026-07-14

## Verified Controls

- Supabase project URL validated as `https://rgcgtcycbiuhcaoaadbh.supabase.co`.
- `.env.local` is not tracked by Git.
- Secret scan over repository sources found no committed Supabase keys or database passwords.
- Supabase Auth endpoint responded successfully.
- Storage check confirmed 10 private buckets.
- RLS audit passed for the checked operational tables and functions.
- Middleware protects dashboard routes.
- Role checks are enforced in server components through `requireRole`.
- Public tracking hides private names, phones, addresses, OTP, documents and declared values.
- CSP production policy does not include `unsafe-eval`.
- `frame-ancestors 'none'`, `X-Frame-Options: DENY`, HSTS, nosniff and strict referrer policy are configured.

## Fixes Applied

- Removed default OTP exposure from `/api/final-delivery/otp`.
- Added `lib/final-delivery/otp-visibility.ts` with a test-only gate.
- Removed default delivery OTP exposure from `/api/shipments`.
- Removed OTP overfetch/rendering from transporter mission detail.
- Added tests proving OTP exposure is production-disabled and E2E-flag controlled.
- Added test proving production/test CSP excludes `unsafe-eval`.

## Remaining Risks

- Legacy `shipments.delivery_otp_code` still exists in the database schema. It is no longer returned by the audited app routes, but a future migration should remove or hash this legacy field after confirming old delivery flows no longer need it.
- Rate limiting and brute-force protection rely on Supabase defaults and are not yet backed by app-level throttling.
- Production payment, payout, SMS, WhatsApp, email and KYC providers are not integrated.
- Upload malware scanning and content inspection are not integrated.
- No external WAF or bot protection configuration was verified.

## Security Score

86/100
