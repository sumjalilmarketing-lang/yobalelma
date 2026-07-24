# Hub App Security

## Implemented

- Middleware protects `/hub/*` and `/api/hub/*`.
- Server layout checks the Hub session.
- API handlers check role permissions before mutation.
- Real Supabase Auth sessions are accepted for internal Hub roles resolved from `profiles`, `user_roles`, Hub agent profiles or operations profiles.
- Demo sessions are HTTP-only and HMAC signed.
- `operations_manager` can orchestrate Hub write APIs required by the international batch workflow.
- Manager-only settings route is restricted.
- QR tokens are opaque, one-use, expiring and audited.
- Critical mutations add audit events.
- `.env.local` remains ignored by Git.

## Supabase

The production database model uses RLS policies and RPC functions from the Hub migrations. The Hub migrations are applied remotely and add `hub_supervisor`, updated Hub access coverage and corrected `operations_manager` write access for international batch orchestration. In a real Supabase Hub session, Hub write APIs call the live RPC/table paths before falling back to the demo runtime store for local execution.

Latest remote audit:

- missing RLS: none;
- missing required policies: none;
- missing required functions: none;
- private buckets checked: 10;
- Auth endpoint reachable.

The full authenticated international E2E workflow passed after the RLS correction.

## Remaining Production Hardening

- Complete the Supabase-backed read model for Hub screens.
- Seed non-production Supabase test users for every Hub role.
- Add rate limiting at the edge or gateway layer.
