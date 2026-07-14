# Yobalelma Deployment Guide

Date: 2026-07-14

## Required Environment

Do not commit environment files. Configure secrets only in the deployment platform.

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `SUPABASE_ACCESS_TOKEN`
- `NEXT_PUBLIC_APP_URL`

## Validation Before Deployment

Run:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run build`
- `npm run validate:supabase`
- `npm run audit:supabase-security`
- `npm run configure:storage`
- `npm run migrate:supabase:management pending`

## Deployment Notes

- Use only the Yobalelma Supabase project.
- Never deploy with `.env.local` committed.
- Root E2E should stay serialized unless a disposable test Supabase project is used per worker.
- Production CSP excludes `unsafe-eval`; local development can still use it for Next.js dev tooling.
- Set `YOBALELMA_EXPOSE_TEST_OTP` only in E2E test servers, never in production.

## Rollback

- Keep each deployment tied to a Git commit SHA.
- Validate Supabase migration reversibility manually before any destructive schema change.
- Do not delete remote data without a reviewed backup and explicit human approval.
