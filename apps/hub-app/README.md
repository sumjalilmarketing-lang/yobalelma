# Yobalelma Hub App

Independent Hub application for `hub.yobalelma.com`.

## Responsibilities

- inbound manifests and package scans;
- inspection, weight checks, human decisions and quarantine;
- storage, inventory and movements;
- traveler trips, flights and capacities;
- batches, reservations, pickup QR and traveler handover;
- anomalies, reports, tracking, notifications and audit logs.

## Commands

```bash
node scripts/next-with-root-env.mjs dev --hostname 127.0.0.1 --port 43122
node scripts/next-with-root-env.mjs build
node ../../node_modules/vitest/vitest.mjs run --config vitest.config.mjs
node scripts/run-e2e.mjs
```

## Demo Accounts

These signed local accounts remain available for offline demonstrations. In a configured environment, the sign-in page also accepts real Supabase Auth credentials for users assigned to Hub roles.

- `agent.hub@yobalelma.test` / `HUB-AGENT`
- `supervisor.hub@yobalelma.test` / `HUB-SUPERVISOR`
- `manager.hub@yobalelma.test` / `HUB-MANAGER`
- `operations@yobalelma.test` / `OPS-READ`
