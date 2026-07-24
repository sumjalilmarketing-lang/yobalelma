# User App Test Report

Date: 2026-07-20

## Commands executed

- Supabase validation: passed.
- Supabase migration apply: passed, 1 migration applied.
- Supabase storage ensure: passed, 10 private buckets already present.
- Supabase security audit: passed.
- Workspace lint: passed.
- Workspace typecheck: passed.
- User-app unit tests: passed, 2 files, 8 tests.
- Workspace unit/integration tests: passed, 17 files, 90 tests.
- Workspace production build: passed.
- User-app independent production build: passed.
- User-app E2E: passed, 78/78 tests.
- User-app visual demo: passed, 18 screenshots generated.

## Playwright specs

- `user-client-registration.spec.ts` - passed.
- `user-login-reset.spec.ts` - passed.
- `user-multi-role-switching.spec.ts` - passed.
- `user-national-shipment.spec.ts` - passed.
- `user-international-shipment.spec.ts` - passed.
- `user-transporter-mission.spec.ts` - passed.
- `user-traveler-trip.spec.ts` - passed.
- `user-recipient-delivery.spec.ts` - passed.
- `user-public-tracking.spec.ts` - passed.
- `user-app-access-control.spec.ts` - passed.
- `user-mobile-responsive.spec.ts` - passed.
- `user-app-visual-demo.spec.ts` - passed.
- `user-secure-upload.spec.ts` - passed; real private upload validated and the test file removed afterward.

## Bugs found and fixed during validation

- Vitest user-app config used a directory `new URL` pattern that failed under Windows/esbuild sandbox; fixed with `path.dirname(fileURLToPath(import.meta.url))`.
- Public tracking form posted to legacy `/suivi`; changed to `/tracking`.
- Playwright assertions were too strict for duplicated premium headings; tests now use exact headings or first matching visible element.
- Visual demo needed authenticated captures to reconnect per protected route.
- The route audit now covers all 66 public and protected page routes.
- Technical service errors are normalized before they reach visible interfaces.

## Notes

Some commands required execution outside the restricted sandbox because Vitest/esbuild needed parent directory reads, Playwright needed a browser/server, and Supabase validation/migration needed HTTPS access. No secret was printed.
