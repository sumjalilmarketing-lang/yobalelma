# Manual Corrections Audit

Date: 2026-07-14

## Implemented

Tables and logs:

- `manual_corrections`
- `audit_log_events`
- `delivery_events`
- `payout_release_events`
- `otp_events`

Admin routes:

- `/dashboard/admin/manual-corrections`
- `/dashboard/admin/manual-corrections/[id]`
- `/dashboard/admin/delivery-overrides`
- `/dashboard/admin/otp-events`
- `/dashboard/admin/proof-of-delivery`
- `/dashboard/admin/payout-review`
- `/dashboard/admin/audit-logs`

## Sensitive Actions

The implemented admin correction workflow records:

- actor;
- permission key;
- entity type and ID;
- action;
- reason;
- comment;
- old value;
- new value;
- approval status;
- timestamp.

Supported permission keys include:

- `delivery.override`
- `otp.override`
- `payout.review`
- `payout.release`
- `proof.review`
- `manual_correction.approve`

## Remaining Production Work

- Enforce second-person approval for selected high-risk actions in UI.
- Add immutable export to external audit storage.
- Add IP/device context when available from deployment platform headers.
