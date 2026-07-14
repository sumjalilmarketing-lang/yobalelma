# OTP Security

Date: 2026-07-14

## Implemented

- Table `delivery_otps` stores hashed OTP codes only.
- Table `otp_attempts` records success and failure attempts.
- Table `otp_events` records lifecycle events.
- OTP is generated server-side by `generate_delivery_otp`.
- OTP verification is server-side only through `verify_delivery_otp`.
- OTP can be revoked through `revoke_delivery_otp`.
- Expired, revoked, used, and blocked statuses are represented.
- A new OTP revokes active previous OTPs for the same shipment and delivery mode.
- Failed attempts are counted and can temporarily block validation.
- OTP value is only returned by the API outside production for E2E/dev validation.

## Protections

- No clear OTP is persisted.
- Public tracking never exposes OTP.
- Client shipment detail no longer displays legacy clear OTP.
- RLS is enabled on OTP tables.
- Admin sees OTP status and attempts, not clear codes.

## Remaining Production Work

- Add a dedicated rate limiter backed by Redis or Supabase edge storage for resend and verify endpoints.
- Integrate real SMS/WhatsApp/email delivery providers.
- Add provider delivery receipt handling.
- Add production monitoring for repeated OTP failure patterns.
