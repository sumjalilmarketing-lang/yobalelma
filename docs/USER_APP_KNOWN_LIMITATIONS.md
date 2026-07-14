# User App Known Limitations

## Critical before production

- External preview/staging deployment could not be created from this workspace because `vercel`, `npx`, `gh`, `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are unavailable.
- Orange Money, Wave and card payments are not live integrations; the current flow is sandbox/manual.
- Email, SMS, WhatsApp and push providers remain abstracted or Supabase Auth based.
- Production rate limiting needs infrastructure support at edge/API gateway level.

## High priority

- Some protected dashboards show connected counters and empty states until real business data exists.
- KYC review is functional at data/workflow level, but production verification operations require final back-office operating rules.
- Recipient delivery pages depend on existing final delivery orders for full real-world demonstration.

## Medium priority

- More fraud, concurrency and abuse tests should be added around signup, OTP resend, support tickets and payment retry.
- Public preview should be connected to the same branch after Vercel or another staging provider is available.
- Monitoring, uptime checks and alerting are not yet configured.

## Low priority

- Add more locale-specific illustrations for recipient and traveler subpages.
- Add richer empty-state guidance for brand-new accounts.
