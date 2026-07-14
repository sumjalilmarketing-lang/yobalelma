# Payout Release Rules

Date: 2026-07-14

## Traveler Payout

Traveler payout is eligible only when:

- destination batch is received;
- final delivery order is created;
- package checks do not report blocking anomalies;
- `traveler_payout_eligible` remains true;
- idempotent payout release event is recorded.

Blocking conditions include:

- missing package;
- damaged package;
- delivery blocked;
- dispute;
- manual override requiring review.

## Final Driver Payout

Final driver payout is eligible only when:

- mission is linked to final delivery order;
- delivery mode is `home_delivery`;
- OTP/proof verification succeeds;
- local mission is marked delivered;
- no blocking incident remains open.

## Implemented Safeguards

- `payout_release_events` records eligibility decisions.
- Idempotency keys prevent duplicate final driver payout events.
- Real payment is not triggered without a provider.
- Sandbox/manual provider state is explicit in admin payout review.

## Remaining Production Work

- Integrate real payout provider.
- Add finance approval workflow for high-risk payouts.
- Add fraud scoring and reconciliation exports.
- Add accounting ledger entries separate from operational payout events.
