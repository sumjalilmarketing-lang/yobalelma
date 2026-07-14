# International Test Report

## Added Tests

- `tests/international-workflow.test.ts`
- `tests/e2e/international-operational-routes.spec.ts`

## Coverage

The new unit tests validate:

- the full international workflow step list;
- role-to-workspace mapping;
- action route availability;
- progress mapping from existing shipment statuses.

The new E2E tests validate:

- anonymous protection for the international operational routes;
- authenticated rendering of each role cockpit when Supabase E2E variables are available.

## Executed Results

- Lint: passed with direct ESLint runner.
- Typecheck: passed with direct TypeScript runner.
- Unit/integration tests: 16 files passed, 81 tests passed.
- E2E full suite: 73 tests passed.
- Visual demo E2E: 6 screenshots captured successfully.
- Production build: passed, 54 static pages generated and all dynamic routes compiled.
- Supabase validation: Auth OK, 10 private buckets checked, 69 tables checked.
- Supabase migrations: 20 local migrations checked, 0 pending before apply, 0 applied in this phase.
- Supabase storage: 10 expected private buckets already present, 0 created.
- Supabase security audit: OK, no missing RLS or policies reported by the audit script.

## Commands To Run

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

In this Codex runtime, `npm` itself is not available on PATH. The equivalent project commands were executed with the bundled Node runtime by calling the underlying scripts directly.
