# User App Staging Limitations

Date: 2026-07-14

## Current Status

The external staging URL is usable for demonstration and QA while the local machine, Next.js server and Cloudflare Quick Tunnel process remain running.

## Limitations

- The current URL is a Cloudflare Quick Tunnel URL and is not persistent.
- There is no Vercel Preview project configured in this workspace.
- No remote provider build was executed; the validated build is the local production build.
- Supabase password authentication was tested successfully on staging.
- Supabase email-link callbacks depend on the active staging URL being allowed in Supabase Auth redirect settings. A random quick-tunnel URL is not suitable as a permanent Supabase Auth Site URL.
- The tunnel is not a production hosting environment and has no uptime guarantee.

## Production Recommendation

Create a persistent Vercel Preview or equivalent Next.js hosting project for `apps/user-app`, configure a stable staging domain, then add that stable domain to Supabase Auth Site URL and Redirect URLs.
