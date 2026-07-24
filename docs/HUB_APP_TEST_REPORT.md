# Hub App Test Report

## Executed

- `tsc --noEmit -p apps/hub-app/tsconfig.json`: passed.
- `tsc --noEmit`: passed.
- `eslint apps/hub-app --ignore-pattern .next/** --ignore-pattern next-env.d.ts --max-warnings=0`: passed.
- `eslint . --max-warnings=0`: passed.
- `vitest run --config apps/hub-app/vitest.config.mjs`: passed, 2 files, 15 tests.
- `node scripts/next-with-root-env.mjs build` from `apps/hub-app`: passed.
- `node apps/hub-app/scripts/run-e2e.mjs`: passed, 18 Playwright tests after replacing the runner with an explicit Next.js start/stop flow.
- `next build` from the workspace root: passed.
- Supabase-backed Hub read model implementation: workspace lint passed, workspace typecheck passed, Hub tests passed (15/15), workspace tests passed (112/112), root production build passed (76 routes) and independent Hub production build passed (20 routes).
- Pilot readiness pass on 2026-07-17: four Supabase test users provisioned for `DSS-DAKAR`, `/api/health` returned `status: ok` with `supabase: ok`, and the Hub dashboard was opened and authenticated in the in-app browser.
- `node scripts/supabase-management-migrate.mjs`: applied `20260714160000_complete_hub_app_access.sql`.
- `node scripts/supabase-management-migrate.mjs`: applied `20260715010000_restore_operations_manager_hub_batch_writes.sql`.
- `node scripts/supabase-validate.mjs`: passed, Auth reachable, 69 tables checked, 10 buckets checked.
- `node scripts/supabase-security-audit.mjs`: passed, no missing required RLS/policies/functions.
- `node scripts/supabase-storage-ensure.mjs`: passed, 10 private buckets already present.
- `node scripts/run-e2e.mjs`: passed, 83 Playwright tests.
- Current root Vitest rerun passed outside the restricted filesystem sandbox: 20 files and 112 tests passed.
- Current Supabase validation rerun was blocked by sandbox network denial and escalation rejection, so the prior remote validation result was not refreshed in this pass.

## E2E Passed

The requested Playwright specs exist and passed under `apps/hub-app/tests/e2e/`:

- `hub-auth-access.spec.ts`
- `hub-inbound-reception.spec.ts`
- `hub-manifest-mismatch.spec.ts`
- `hub-inspection.spec.ts`
- `hub-quarantine.spec.ts`
- `hub-storage.spec.ts`
- `hub-inventory-movement.spec.ts`
- `hub-traveler-capacity.spec.ts`
- `hub-batch-creation.spec.ts`
- `hub-capacity-reservation.spec.ts`
- `hub-capacity-race-condition.spec.ts`
- `hub-pickup-qr.spec.ts`
- `hub-handover.spec.ts`
- `hub-anomaly-management.spec.ts`
- `hub-i18n.spec.ts`
- `hub-responsive.spec.ts`
- `hub-visual-demo.spec.ts`

## Fixes From E2E

- Hub authentication redirects now preserve the request host so cookies are not lost between `127.0.0.1`, `localhost` and local staging hosts.
- Hub form actions now use a shared request-based redirect helper instead of hard-coded origins.
- Manifest detail rows now display the current inbound item status after scan.
- Supabase RLS now allows `operations_manager` to create/update Hub batches and capacity reservations for the full international workflow.
- Hub `operations_manager` app permissions now match the RLS model and can execute Hub write orchestration endpoints.
- Hub API routes now attempt Supabase live mutations for inbound scans, inspections, storage moves, batch creation/reservation, QR generation, handover and anomalies when a real Supabase Hub session is present.
- Hub E2E runner now starts/stops Next.js explicitly to avoid Playwright web server hangs on Windows.
- E2E locators were tightened for duplicate headings and responsive controls.

## Remaining External Validation

External HTTPS staging and replacement of the local Hub demo read model with live Supabase reads still require implementation.
