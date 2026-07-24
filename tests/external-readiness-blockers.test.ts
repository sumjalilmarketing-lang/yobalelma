import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { ExternalMalwareScanner, malwareScanResultSchema, secureUploadDecision } from "@/lib/security/malware-scanner";
import { ExternalObservabilityProvider, ExternalOnCallAlertProvider, redactTelemetryEvent } from "@/lib/observability/provider";
import { ExternalNotificationProvider, notificationRetryDelayMs } from "@yobalelma/notifications";
import { validateLoadTarget, validateScenario } from "../scripts/lib/critical-load-runner.mjs";

const upload = { uploadId: "11111111-1111-4111-8111-111111111111", bucket: "kyc-documents", storagePath: "11111111-1111-4111-8111-111111111111/front.jpg", declaredMimeType: "image/jpeg", declaredSizeBytes: 1024 };
const telemetry = { name: "kyc.scan.failed", occurredAt: "2026-07-22T10:00:00.000Z", traceId: "a".repeat(32), spanId: "b".repeat(16), severity: "error" as const, attributes: { email: "pilot@yobalelma.test", token: "Bearer private-token" } };

describe("external readiness blockers", () => {
  it("keeps KYC uploads quarantined when no malware provider is selected", async () => {
    await expect(new ExternalMalwareScanner("unconfigured").scan(upload)).rejects.toThrow("MALWARE_SCANNER_ACCESS_REQUIRED");
  });
  it("normalizes a scanner verdict without raw provider payload", () => {
    const result = malwareScanResultSchema.parse({ verdict: "infected", providerReference: "scan-1", contentSha256: "a".repeat(64), definitionsVersion: "2026.07", scannedAt: "2026-07-22T10:00:00.000Z", failureCode: null });
    expect(secureUploadDecision(result).securityStatus).toBe("infected");
  });
  it("redacts telemetry and fails closed without an APM transport", async () => {
    expect(redactTelemetryEvent(telemetry).attributes).toEqual({ email: "[email]", token: "Bearer [redacted]" });
    await expect(new ExternalObservabilityProvider("unconfigured").emit(telemetry)).rejects.toThrow("OBSERVABILITY_PROVIDER_ACCESS_REQUIRED");
    await expect(new ExternalOnCallAlertProvider("unconfigured").notify({ deduplicationKey: "health:user", title: "User App indisponible", summary: "Le contrôle de disponibilité a échoué.", severity: "critical", occurredAt: "2026-07-22T10:00:00.000Z", runbookUrl: "https://docs.example.test/runbooks/user" })).rejects.toThrow("ON_CALL_PROVIDER_ACCESS_REQUIRED");
  });
  it("validates notification receipts and bounded retries", async () => {
    const transport = vi.fn().mockResolvedValue({ providerReference: "provider-1", acceptedAt: "2026-07-22T10:00:00.000Z" });
    const provider = new ExternalNotificationProvider("email-provider", "email", transport);
    await expect(provider.send({ idempotencyKey: "shipment:123456", channel: "email", recipient: "pilot@yobalelma.test", locale: "fr-FR", templateKey: "shipment.updated", variables: {} })).resolves.toMatchObject({ providerReference: "provider-1" });
    expect(notificationRetryDelayMs(20)).toBe(15 * 60_000);
  });
  it("refuses production load and malformed scenarios", () => {
    expect(() => validateLoadTarget("https://yobalelma-user.vercel.app", "disposable-staging")).toThrow("PRODUCTION_LOAD_TARGET_REFUSED");
    expect(() => validateLoadTarget("https://staging.example.test", "production")).toThrow("DISPOSABLE_STAGING_CONFIRMATION_REQUIRED");
    expect(() => validateScenario({ steps: [{ name: "bad", method: "DELETE" as never, path: "/api/test" }] })).toThrow("INVALID_LOAD_METHOD");
  });
  it("keeps scan and notification workers service-only and leased", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260722040000_external_readiness_queues.sql"), "utf8");
    const acl = readFileSync(resolve(process.cwd(), "supabase/migrations/20260722041000_lock_external_worker_rpcs.sql"), "utf8");
    expect(sql).toContain("for update skip locked");
    expect(sql).toContain("Service role required");
    expect(sql).toContain("dead_lettered_at");
    expect(sql).toContain("Scan lease is no longer valid");
    expect(acl).toContain("from public, anon, authenticated");
    expect(acl).toContain("to service_role");
  });
  it("requires an isolated DR target and distinct credentials", () => {
    const source = readFileSync(resolve(process.cwd(), "scripts/verify-disaster-recovery.mjs"), "utf8");
    expect(source).toContain("target.hostname.endsWith");
    expect(source).toContain("Source and target credentials must be distinct");
    expect(source).toContain('"secure_upload_scan_events"');
  });
});
