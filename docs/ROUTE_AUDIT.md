# Route Audit

Date: 2026-07-12

## Summary

- Total App Router entries: 88.
- Pages: 48.
- Route handlers: 40.
- Non-dynamic pages tested over HTTP: 43.
- Non-dynamic API route handlers tested over anonymous GET: 37.
- Dynamic entries requiring seeded IDs: 8.
- Server errors after cleanup: 0.

Classification rules:

- Functional and tested: route opens without 500, redirects/protects as expected, or returns the expected anonymous API refusal.
- Partially functional: code exists and builds, but needs authenticated seeded data or an external provider to prove the full workflow.
- Visual only: page is mostly a UI/form shell without proven persistence.
- Broken: reproducible 500/build/runtime failure remaining after correction.
- Inaccessible: cannot be tested without a real dynamic ID or authenticated fixture.
- Not connected to Supabase: no Supabase/API persistence path identified.

## Page Routes

| Route | Status | Audit result |
| --- | --- | --- |
| `/` | Functional and tested | 200, visual smoke passed, official logo visible. |
| `/auth/forgot-password` | Functional and tested | 200, auth form route builds. |
| `/auth/reset-password` | Functional and tested | 200, auth form route builds. |
| `/auth/sign-in` | Functional and tested | 200, visual smoke passed. |
| `/auth/sign-up` | Functional and tested | 200, route builds. |
| `/dashboard` | Functional and tested | 307 anonymous redirect to sign-in. |
| `/dashboard/admin` | Partially functional | 307 anonymous redirect; full admin role not manually tested. |
| `/dashboard/client` | Partially functional | 307 anonymous redirect; dashboard data uses Supabase. |
| `/dashboard/client/kyc` | Partially functional | 307 anonymous redirect; KYC form present. |
| `/dashboard/client/shipments` | Partially functional | 307 anonymous redirect; needs authenticated client data. |
| `/dashboard/client/shipments/[id]` | Inaccessible without fixture | Dynamic shipment ID required. |
| `/dashboard/client/shipments/new` | Partially functional | 307 anonymous redirect; shipment form and RPC path present. |
| `/dashboard/collection` | Partially functional | 307 anonymous redirect. |
| `/dashboard/collection/manifests` | Partially functional | 307 anonymous redirect; manifest UI present. |
| `/dashboard/collection/routes` | Partially functional | 307 anonymous redirect; route planning UI present. |
| `/dashboard/collection/routes/[id]` | Inaccessible without fixture | Dynamic collection route ID required. |
| `/dashboard/collection/scanner` | Partially functional | 307 anonymous redirect; scanner surface present. |
| `/dashboard/hub` | Partially functional | 307 anonymous redirect; hub forms present. |
| `/dashboard/hub/batches` | Partially functional | 307 anonymous redirect; batch UI present. |
| `/dashboard/hub/batches/[id]` | Inaccessible without fixture | Dynamic batch ID required. |
| `/dashboard/hub/handover` | Partially functional | 307 anonymous redirect; QR handover UI present. |
| `/dashboard/hub/inbound` | Partially functional | 307 anonymous redirect; inspection UI present. |
| `/dashboard/hub/inventory` | Partially functional | 307 anonymous redirect; inventory route exists. |
| `/dashboard/hub/trips` | Partially functional | 307 anonymous redirect; trip/capacity route exists. |
| `/dashboard/kyc` | Partially functional | 307 anonymous redirect; shared KYC route. |
| `/dashboard/operations` | Partially functional | 307 anonymous redirect; operations overview present. |
| `/dashboard/relay` | Partially functional | 307 anonymous redirect; relay UI present. |
| `/dashboard/relay/inbound` | Partially functional | 307 anonymous redirect; inbound route present. |
| `/dashboard/relay/inventory` | Partially functional | 307 anonymous redirect; inventory route present. |
| `/dashboard/relay/outbound` | Partially functional | 307 anonymous redirect; outbound handover route present. |
| `/dashboard/relay/scanner` | Partially functional | 307 anonymous redirect; scanner route present. |
| `/dashboard/support` | Partially functional | 307 anonymous redirect; support dashboard route present. |
| `/dashboard/transporter` | Partially functional | 307 anonymous redirect; transporter dashboard present. |
| `/dashboard/transporter/availability` | Partially functional | 307 anonymous redirect; availability form present. |
| `/dashboard/transporter/missions` | Partially functional | 307 anonymous redirect; mission list route present. |
| `/dashboard/transporter/missions/[id]` | Inaccessible without fixture | Dynamic mission ID required. |
| `/dashboard/transporter/vehicle` | Partially functional | 307 anonymous redirect; vehicle form present. |
| `/dashboard/transporter/zones` | Partially functional | 307 anonymous redirect; zone form present. |
| `/dashboard/traveler` | Partially functional | 307 anonymous redirect; traveler dashboard present. |
| `/dashboard/traveler/kyc` | Partially functional | 307 anonymous redirect; traveler KYC form present. |
| `/dashboard/traveler/qr-codes` | Partially functional | 307 anonymous redirect; QR token list route present. |
| `/dashboard/traveler/trips` | Partially functional | 307 anonymous redirect; trips route present. |
| `/dashboard/traveler/trips/[id]` | Inaccessible without fixture | Dynamic trip ID required. |
| `/dashboard/traveler/trips/new` | Partially functional | 307 anonymous redirect; trip creation route present. |
| `/envoyer` | Functional and tested | 200, visual smoke passed, shipment form visible. |
| `/livreur` | Functional and tested | 200, visual smoke passed, transporter form visible. |
| `/support` | Functional and tested | 200, visual smoke passed, support CTA present. |
| `/voyager` | Functional and tested | 200, visual smoke passed, traveler trip form visible. |

## API and Route Handlers

| Route | Status | Audit result |
| --- | --- | --- |
| `/api/auth/forgot-password` | Functional and tested | GET returns 405, POST handler present. |
| `/api/auth/password-sign-in` | Functional and tested | GET returns 405, POST handler present. |
| `/api/auth/reset-password` | Functional and tested | GET returns 405, POST handler present. |
| `/api/auth/sign-in` | Functional and tested | GET returns 405, POST handler present. |
| `/api/auth/sign-out` | Functional and tested | GET returns 405, POST handler present. |
| `/api/auth/sign-up` | Functional and tested | GET returns 405, POST handler present. |
| `/api/collection/manifests` | Functional and tested | GET returns 405, POST handler present. |
| `/api/collection/routes` | Functional and tested | GET returns 405, POST handler present. |
| `/api/collection/routes/[id]` | Inaccessible without fixture | Dynamic route ID required. |
| `/api/commissions` | Functional and tested | Anonymous GET returns 401. |
| `/api/delivery-proofs` | Functional and tested | Anonymous GET returns 400 because required query/body context is absent. |
| `/api/disputes` | Functional and tested | Anonymous GET returns 401. |
| `/api/hub/assignments` | Functional and tested | GET returns 405, POST handler present. |
| `/api/hub/batches` | Functional and tested | GET returns 405, POST handler present. |
| `/api/hub/batches/[id]` | Inaccessible without fixture | Dynamic batch ID required. |
| `/api/hub/inspections` | Functional and tested | GET returns 405, POST handler present. |
| `/api/kyc` | Functional and tested | GET returns 405, POST handler present. |
| `/api/notifications` | Functional and tested | Anonymous GET returns 401. |
| `/api/parcel-requests` | Functional and tested | GET returns 405, POST handler present. |
| `/api/payments/intents` | Functional and tested | GET returns 405, POST handler present. |
| `/api/profile` | Functional and tested | GET returns 405, POST handler present. |
| `/api/qr/handover` | Functional and tested | GET returns 405, POST handler present; E2E QR workflow passed. |
| `/api/qr/scan` | Functional and tested | GET returns 405, POST handler present; anonymous security E2E passed. |
| `/api/relay/points` | Functional and tested | GET returns 405, POST handler present. |
| `/api/relay/scans` | Functional and tested | GET returns 405, POST handler present. |
| `/api/shipments` | Functional and tested | GET returns 405, POST handler present. |
| `/api/storage/signed-upload` | Functional and tested | GET returns 405, POST handler present. |
| `/api/support/messages` | Functional and tested | GET returns 405, POST handler present. |
| `/api/support/tickets` | Functional and tested | GET returns 405, POST handler present. |
| `/api/transporters/availability` | Functional and tested | GET returns 405, POST handler present. |
| `/api/transporters/dispatch` | Functional and tested | GET returns 405; anonymous dispatch E2E passed. |
| `/api/transporters/matches` | Functional and tested | Anonymous GET returns 400 because required matching query is absent. |
| `/api/transporters/missions` | Functional and tested | Anonymous GET returns 401. |
| `/api/transporters/missions/[id]` | Inaccessible without fixture | Dynamic mission ID required. |
| `/api/transporters/profile` | Functional and tested | GET returns 405, POST handler present. |
| `/api/transporters/vehicles` | Functional and tested | GET returns 405, POST handler present. |
| `/api/transporters/zones` | Functional and tested | GET returns 405, POST handler present. |
| `/api/travel-documents` | Functional and tested | GET returns 405, POST handler present. |
| `/api/trips` | Functional and tested | GET returns 405, POST handler present. |
| `/auth/callback` | Functional and tested | Anonymous GET redirects 307. |

## Remaining Route Risks

- Dynamic dashboard pages need seeded records for real 200/404/permission testing.
- Dashboard pages were tested anonymously for protection, not with every role session.
- Many APIs are POST/PATCH workflow endpoints; GET audits prove no anonymous 500, not complete workflow success.
- No route remains broken after `.next` cleanup and test rerun.
