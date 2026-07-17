# Hub App Staging

## Target

Future domain: `hub.yobalelma.com`.

## Current Status

No HTTPS external staging URL was created in this phase because no deploy connector, Vercel token or approved tunnel execution is available in the current environment.

Local pilot preview verified on 2026-07-17:

- URL: `http://localhost:43122/hub`;
- Supabase health: `ok`;
- browser login: passed with the signed local `hub_agent` demo session;
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
