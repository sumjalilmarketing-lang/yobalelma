# Yobalelma Bug Report

Date: 2026-07-14

## Bugs Found And Fixed

1. OTP code exposed by default in non-production API responses.
   - Fixed by explicit `YOBALELMA_EXPOSE_TEST_OTP=1` gate.

2. Shipment creation returned a legacy delivery OTP code.
   - Fixed by returning it only through a test-only field under the same explicit gate.

3. Transporter mission page selected and displayed client OTP.
   - Fixed by removing the sensitive column from the query and replacing the UI value with a non-secret instruction.

4. CSP allowed `unsafe-eval` globally.
   - Fixed by allowing it only for local `development`, not production or tests.

5. Authenticated E2E tests used random passwords for shared remote test users.
   - Fixed by deterministic test-only passwords per role/namespace.

6. Root E2E tests collided against a shared remote Supabase Auth project when run with multiple workers.
   - Fixed by defaulting root Playwright to one worker.

7. Long Supabase-connected visual and international workflows exceeded default timeouts under load.
   - Fixed by extending only the relevant long-running test budgets.

## Bugs Remaining

- No critical bug is currently known after the final validation run.
- Production-readiness gaps remain and are tracked as tech debt/integration work.
