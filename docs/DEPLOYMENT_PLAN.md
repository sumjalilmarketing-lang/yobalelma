# Deployment Plan

## Target Domains

| App | Domain | Deployment status |
| --- | --- | --- |
| `user-app` | `app.yobalelma.com` | Planned |
| `hub-app` | `hub.yobalelma.com` | Planned |
| `collection-app` | `collecte.yobalelma.com` | Planned |
| `relay-app` | `relais.yobalelma.com` | Planned |
| `admin-app` | `admin.yobalelma.com` | Planned |

## Shared Environment Variables

Every app uses the same Supabase project and must receive:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` if needed for compatibility
- `SUPABASE_SERVICE_ROLE_KEY` only in server-only environments that need it

No app should receive secrets it does not need.

## Build Strategy

Phase 1 keeps the root Next.js build as the validated production build. Independent app builds will be added when routes are migrated into each app.

Planned commands:

- `npm --workspace @yobalelma/user-app run build`
- `npm --workspace @yobalelma/hub-app run build`
- `npm --workspace @yobalelma/collection-app run build`
- `npm --workspace @yobalelma/relay-app run build`
- `npm --workspace @yobalelma/admin-app run build`

## Health Checks

Each app must expose:

- `/health`
- `/api/health`
- a Supabase connectivity check;
- a build/version marker;
- error logging.

## Vercel

Use one of two stable deployment models:

1. five Vercel projects pointing to one monorepo;
2. one Vercel monorepo with five project entries.

The recommended model is five Vercel projects because the apps have different domains, roles and risk profiles.
