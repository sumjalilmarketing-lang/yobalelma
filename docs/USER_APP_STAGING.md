# User App Staging

## Requested preview

Target: Vercel Preview for `apps/user-app`.

## Actual status

Blocked in the current workspace.

The following required preview tools or credentials are not available:

- `vercel` CLI: not found.
- `npx`: not found.
- `gh` CLI: not found.
- `VERCEL_TOKEN`: not present.
- `VERCEL_ORG_ID`: not present.
- `VERCEL_PROJECT_ID`: not present.
- `GITHUB_TOKEN`: not present.

No external URL was created.

## Local verified URL

The app is verified locally on:

- `http://127.0.0.1:43121`

## Demo accounts

Only E2E test accounts were created or updated through Supabase service APIs. They use the `codex.*@yobalelma.test` naming convention and are marked with E2E metadata.

## Deployment procedure once credentials exist

1. Configure a Vercel project for `apps/user-app`.
2. Set environment variables from the secure provider, never from committed files.
3. Deploy branch `codex/complete-user-app`.
4. Run smoke tests against the preview URL.
5. Update this file with the exact URL, commit and deployment status.
