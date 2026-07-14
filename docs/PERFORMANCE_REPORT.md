# Yobalelma Performance Report

Date: 2026-07-14

## Build Metrics

Root app:

- Build: passed.
- Static generation: 76 static pages generated.
- Shared first load JS: about 102 kB.
- Middleware bundle: about 106 kB.

User app:

- Build: passed.
- Static generation: 54 static pages generated.
- Shared first load JS: about 102 kB.
- Middleware bundle: about 90.7 kB.

## Optimizations And Controls

- Production builds complete successfully.
- Most route chunks are small and share a compact base bundle.
- Visual E2E tests cover desktop and mobile rendering surfaces.
- Root E2E is serialized by default to protect the shared remote Supabase test environment from auth contention.

## Remaining Work

- Run Lighthouse/Core Web Vitals in a production deployment, not only local Playwright.
- Add bundle analyzer reporting to CI.
- Add query latency dashboards for Supabase.
- Add pagination/virtualization review for future large admin and operations tables.
- Run real k6/Artillery load tests against a disposable staging database before national launch.

## Performance Score

82/100
