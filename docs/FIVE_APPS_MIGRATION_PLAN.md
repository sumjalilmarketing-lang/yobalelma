# Five Apps Migration Plan

## Phase 1 Completed In This Branch

- Create `apps/*` skeletons.
- Create `packages/*` shared package skeletons.
- Add npm workspaces.
- Add route and ownership documentation.
- Add access policy helpers.
- Add new internal roles: `hub_manager`, `collection_manager`, `relay_manager`, `finance_agent`.
- Keep the root app as legacy host.

## Phase 2: User App

Migrate:

- public landing and acquisition pages;
- auth pages;
- client dashboard;
- local transporter dashboard;
- traveler dashboard;
- public and private tracking;
- user support entry points.

Validation:

- user-app lint/typecheck/test/build;
- role switching tests;
- public tracking tests;
- external role denial on internal apps.

## Phase 3: Hub App

Migrate:

- hub dashboard;
- inbound reception;
- inspection;
- inventory/storage;
- batches/capacity;
- QR handover;
- anomalies and reports.

Validation:

- hub-app unit tests;
- hub-app E2E scanner and batch tests;
- RLS and RPC audit.

## Phase 4: Collection App

Migrate:

- collection dashboard;
- routes;
- manifests;
- scanner;
- vehicle and incident flows.

## Phase 5: Relay App

Migrate:

- relay inbound;
- relay inventory;
- relay outbound;
- relay scanner;
- destination reception.

## Phase 6: Admin App

Migrate:

- operations control center;
- support;
- finance;
- KYC;
- users, roles, permissions;
- analytics, audit and system health.

## Phase 7: Cross-App Security

- Add host-based middleware per app.
- Add app-level deny tests for every role/app combination.
- Add Storage object policies by path.
- Add MFA requirements for internal accounts.

## Phase 8: Deployment

- Configure five Vercel projects or five Vercel apps in one project strategy.
- Attach target domains.
- Add health checks and logs per app.
- Run independent builds.
