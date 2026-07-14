# International Workflow Security

## Implemented Controls

- All operational pages use `requireRole`.
- Data reads use the Supabase server client tied to the authenticated session.
- Cockpit data respects RLS and surfaces warnings on denied reads.
- QR scan calls `/api/qr/scan`, which validates the user session and delegates token verification to the Supabase RPC.
- No secrets are embedded in code or documentation.

## Role Boundaries

- Client pages are limited to `client`.
- First-mile pages are limited to `local_transporter`.
- Relay pages include relay roles and internal supervisors.
- Collection pages include collection roles and internal supervisors.
- Hub pages include hub roles and internal supervisors.
- Traveler pages are limited to `traveler`.
- Admin cockpit is limited to operations/admin roles.

## Risks Still To Close

- Full external notification delivery is not implemented.
- Payment capture and payout execution remain sandbox/provider-dependent.
- Fine-grained admin action audit should be expanded for every manual override.
- Upload malware scanning and document verification providers are not connected.
- Load testing and query plan review are still required before production traffic.
