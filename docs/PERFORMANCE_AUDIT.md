# Performance Audit

Date: 2026-07-12

## Build Metrics

Production build passed after generated `.next` cleanup.

Observed shared first-load JS:

- Shared JS: about 102 kB.
- Static public pages: `/`, `/envoyer`, `/livreur`, `/support`, `/voyager`, auth form pages.
- Dynamic dashboard/API routes are server-rendered or route handlers as expected.

## Positive Findings

- Public and dashboard routes compile under Next.js 15 App Router.
- Static public surfaces are prerendered where possible.
- `next/image` is used for official logo imagery on the landing page.
- E2E dev builds now use `.next-e2e`, isolated from production `.next` builds.
- E2E responsive checks found no horizontal overflow on tested public routes.
- No dependency vulnerability was reported by `npm audit --audit-level=moderate`.

## Warnings Observed

Build warnings:

- Webpack cache warns about serializing large strings.
- `@supabase/supabase-js` import trace in Edge Runtime warns about `process.version` usage through Supabase SSR middleware.

Impact:

- The build succeeds, so these are not blocking demonstration/internal testing.
- The Edge Runtime warning should be evaluated before production because middleware runs at the edge in Next.js.

## Data and Query Risks

- Dashboard data queries are simple and limited, but production lists need cursor pagination and filters.
- Production query plans were not collected in this phase; add query-plan review for dispatch, tracking and dashboard counters before pilot load testing.
- Several workflows rely on RPCs; concurrent scan/dispatch/payout paths need load and race-condition tests before pilot.
- Search/filter indexes should be revisited once real traffic and query patterns are known.

## Asset Risks

- Official logo raster assets are present. Image dimensions are controlled.
- More product visuals should stay optimized and served through `next/image`.
- Upload-heavy workflows need server-side file constraints and client preview compression checks.

## Performance Verdict

Performance is acceptable for local demo and internal testing. Production readiness requires query-plan review, pagination on operational lists, Edge Runtime warning review, load testing for QR/dispatch and upload-size enforcement.
