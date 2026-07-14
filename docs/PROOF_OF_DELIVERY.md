# Proof Of Delivery

Date: 2026-07-14

## Implemented Tables

- `proof_of_delivery`
- `proof_of_delivery_summaries`
- `delivery_signatures`
- `delivery_photos`
- `delivery_events`
- Existing `delivery_proofs` is still used as the operational proof attachment table.

## Privacy Model

- Full proof is private and staff-restricted.
- Sender/client reads only `proof_of_delivery_summaries`.
- Public tracking does not expose full proof, address, phone, KYC, OTP, or financial details.

## Capture Methods

- OTP proof is implemented.
- Signature path and photo path can be attached when available.
- Manual override can create alternative proof through admin workflow.

## Verified

- OTP verification creates proof records and public-safe summaries.
- Client shipment detail shows authorized proof summaries.
- Admin proof review screen is available at `/dashboard/admin/proof-of-delivery`.

## Remaining Production Work

- Real file upload UX for signatures/photos needs device-level capture and signed Storage upload.
- Add retention policy by jurisdiction.
- Add image virus/malware scanning before long-term proof storage.
