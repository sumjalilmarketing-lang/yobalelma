# Hub App Production Readiness

## Demonstration

Ready for local demonstration. The app builds independently, Hub workflows are implemented, E2E tests pass, and visual screenshots are generated.

## Internal Test

Ready for controlled internal testing with non-production accounts. Unit, integration, Hub E2E tests and production builds pass locally. Supabase Auth sessions are accepted for internal Hub roles, and write APIs attempt live Supabase mutations before falling back to the local demo store.

## Pilot

Not ready. Remote migrations, RLS and private Storage were validated during this phase. Authenticated Hub sessions use a Supabase-backed read model, four non-production Hub accounts are provisioned, and the health endpoint checks Supabase connectivity. The independent Hub app still needs external HTTPS staging and deployment-level observability before pilot traffic.

## Production

Not ready.

Required before production:

- external HTTPS staging;
- monitoring, rate limiting and production observability.
