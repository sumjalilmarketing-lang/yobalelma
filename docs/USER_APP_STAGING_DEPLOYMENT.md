# User App Staging Deployment

Date: 2026-07-14

## Summary

`apps/user-app` is exposed on an external HTTPS staging URL through a temporary Cloudflare Quick Tunnel.

This is a demonstration staging environment, not a persistent provider deployment. Vercel Preview could not be used from this workspace because no Vercel CLI, `npx`, `VERCEL_TOKEN`, `VERCEL_ORG_ID` or `VERCEL_PROJECT_ID` was available.

## Provider

- Provider: Cloudflare Tunnel quick tunnel.
- Project: local `apps/user-app` production server proxied through `cloudflared`.
- URL: `https://sum-funny-lakes-won.trycloudflare.com`
- Local origin: `http://127.0.0.1:43121`
- Branch: `codex/deploy-user-app-staging`
- Build mode: local production build, then `next start`.

## Environment Variables

The deployment used variables already present in the local secure environment. Values are intentionally not documented.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `DATABASE_URL`

## Runtime Fixes

- `apps/user-app/middleware.ts` now protects user-app private spaces directly and creates redirects from forwarded request headers.
- `lib/auth/redirect.ts` now ignores a local configured app URL when the request comes from an external forwarded staging origin.
- This prevents protected staging routes from redirecting to `https://localhost:43121`.

## Redeploy Procedure

1. Build user-app: `node scripts/next-with-root-env.mjs build` from `apps/user-app`.
2. Start production user-app on `127.0.0.1:43121`.
3. Start `cloudflared tunnel --url http://127.0.0.1:43121 --protocol http2 --no-autoupdate`.
4. Use the generated `trycloudflare.com` URL for smoke tests and visual QA.

## Rollback

Stop the local Next.js and Cloudflare Tunnel processes, then switch back to the previous Git commit on the branch.
