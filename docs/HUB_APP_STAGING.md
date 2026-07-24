# Hub App Staging

## Target

Durable production domain: <https://yobalelma-hub.vercel.app>.

Future custom domain: `hub.yobalelma.com`.

## Current Status

The dedicated Vercel project deploys only `apps/hub-app` from
`codex/hub-enterprise-upgrade`. The durable HTTPS deployment was verified on
2026-07-20:

- health endpoint: `200`;
- Supabase health: `ok`;
- real Supabase authentication and Hub role enforcement: passed;
- full authenticated pilot workflow: 2/2 scenarios passed;
- four Supabase pilot accounts provisioned for Hub `DSS-DAKAR`.

## Local Preview

Run from `apps/hub-app`:

```bash
node scripts/next-with-root-env.mjs dev --hostname 127.0.0.1 --port 43122
```

Open:

```text
http://127.0.0.1:43122
```

## Demo Accounts

- `agent.hub@yobalelma.test` / `HUB-AGENT`
- `supervisor.hub@yobalelma.test` / `HUB-SUPERVISOR`
- `manager.hub@yobalelma.test` / `HUB-MANAGER`
- `operations@yobalelma.test` / `OPS-READ`

## Supabase Pilot Accounts

The idempotent provisioning command creates or refreshes four non-production accounts for the selected Hub without committing their password:

```bash
HUB_PILOT_PASSWORD='<secure runtime value>' npm run seed:pilot --workspace=@yobalelma/hub-app
```

Created roles: `hub_agent`, `hub_supervisor`, `hub_manager` and `operations_manager`. The password must only be supplied through the runtime environment.

Provisioning was executed successfully on 2026-07-17. Password values were neither printed nor stored in the repository.
