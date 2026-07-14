# Yobalelma Technical Debt Report

Date: 2026-07-14

## Critical

- Add production payment and payout provider integration.
- Add production KYC verification provider integration.
- Add production-grade app-level rate limiting for auth-sensitive and OTP-sensitive routes.
- Run destructive-free backup/restore drills for Supabase before production.

## High

- Remove or hash legacy `shipments.delivery_otp_code`.
- Add WAF/bot protection strategy.
- Add malware scanning for uploaded files.
- Add APM, metrics dashboards and alerting.
- Make hub, relay, collection and admin apps independently buildable/deployable if the product strategy requires true five-app separation.

## Medium

- Add bundle analyzer and route performance budgets in CI.
- Add large-table pagination/virtualization audits for admin/operations screens.
- Add contract tests for RPC payloads.
- Add provider abstraction packages for SMS, WhatsApp, email, payment, payout and KYC.

## Low

- Continue reducing generic dashboard copy in favor of richer domain-specific operational UX.
- Add more empty-state illustrations for rare error paths.
- Add screenshot diffing for visual regressions.
