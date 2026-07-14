# Notification Transitions

Date: 2026-07-14

## Implemented

Tables:

- `notification_templates`
- `notification_events`
- `notification_deliveries`
- `user_notification_preferences`
- existing `notifications`

Transitions enqueue in-app/sandbox notification events for:

- destination batch received;
- recipient choice defaulted or changed;
- OTP generated;
- OTP failed;
- final delivery scheduled;
- final delivery completed;
- delivery attempts and anomalies;
- payout release eligibility.

## Provider State

- In-app notifications are implemented.
- Email, SMS, WhatsApp and push are represented as provider abstractions/sandbox entries.
- No real external provider is claimed as live.

## Required Before Production

- Configure real provider keys outside Git.
- Add provider callbacks/webhooks.
- Add retry queues and dead-letter review.
- Add unsubscribe and channel preference compliance.
- Add delivery receipt observability.
