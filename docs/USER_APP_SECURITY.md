# User App Security

## Verified protections

- `.env.local`, `.env` and `.env.*.local` are ignored by Git.
- No secret value is committed or documented.
- The browser client only uses public Supabase configuration.
- The service role key is only used by server-side scripts or route handlers.
- Private user routes call server-side auth/role guards.
- `requireRole` now resolves roles from `profiles`, `role_assignments` and `user_roles`.
- A user with several external roles sees only assigned spaces in the space switcher.
- Suspended or closed accounts are blocked before private data is rendered.
- KYC states are visible in protected workspaces.
- Public tracking hides address, phone, OTP, KYC, ticket, private proof and financial details.
- Supabase RLS security audit passed with no missing required RLS, policies or functions.
- Storage verification confirmed 10 private buckets.

## Database security change

Migration applied:

- `20260714103000_include_user_roles_in_current_user_has_role.sql`

This updates `public.current_user_has_role(required_roles text[])` so RLS policies also honor `public.user_roles`.

## Remaining security work

- Add infrastructure rate limiting for auth and public tracking endpoints.
- Add production monitoring for suspicious OTP, QR, payment and support activity.
- Complete provider-level security reviews before enabling Orange Money, Wave, card, SMS, WhatsApp or push integrations.
