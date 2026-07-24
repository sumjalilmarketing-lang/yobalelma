import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { assertVerifiedRelease, SenegalCustomsProvider } from "@/lib/customs/providers";
import { createHsSuggestion, evaluateCustomsRules, indicativeDutyEstimate, type CustomsRule } from "@/lib/customs/rules";

const caseId = "11111111-1111-4111-8111-111111111111";
const proofId = "22222222-2222-4222-8222-222222222222";
const release = { decisionType: "release" as const, decisionReference: "MAINLEVEE-OFFICIELLE-1", authority: "Autorité compétente", reason: null, effectiveAt: "2026-07-22T12:00:00.000Z", verified: true, proofDocumentId: proofId };

describe("customs integration foundation", () => {
  it("fails closed while official Senegal access and mapping are absent", async () => {
    await expect(new SenegalCustomsProvider().getDeclarationStatus(caseId)).rejects.toThrow("SENEGAL_CUSTOMS_OFFICIAL_ACCESS_REQUIRED");
  });

  it("accepts only a verified release with an official reference, authority and proof", () => {
    expect(() => assertVerifiedRelease(release)).not.toThrow();
    expect(() => assertVerifiedRelease({ ...release, verified: false })).toThrow("VERIFIED_CUSTOMS_RELEASE_REQUIRED");
    expect(() => assertVerifiedRelease({ ...release, proofDocumentId: null })).toThrow("VERIFIED_CUSTOMS_RELEASE_REQUIRED");
  });

  it("passes an official release through the injected transport only", async () => {
    const execute = vi.fn().mockResolvedValue({ ok: true });
    const mapping = { caseReference: () => null, declarationReference: () => "DECL-1", status: () => "submitted" as const, webhook: () => ({ externalEventId: "evt-1", eventType: "accepted", occurredAt: "2026-07-22T12:00:00.000Z", payload: {} }), decision: () => release, dutyEstimate: () => ({ amount: 100, currency: "XOF" }) };
    const provider = new SenegalCustomsProvider({ execute, verifyWebhook: vi.fn() }, mapping);
    await provider.releaseShipment(caseId, release);
    expect(execute).toHaveBeenCalledWith("releaseShipment", { caseId, decision: release });
  });

  it("never marks an HS suggestion as legally validated", () => {
    expect(createHsSuggestion({ code: "010121", source: "Référentiel à confirmer", confidence: 0.72, explanation: "Correspondance indicative" }).legallyValidated).toBe(false);
  });

  it("applies only approved, current and destination-country rule versions", () => {
    const base: CustomsRule = { id: caseId, version: 1, countryCode: "SN", status: "approved", effectiveFrom: "2026-01-01", effectiveTo: null, category: "review_required", conditions: { keywords: ["médicament"] }, validatedBy: proofId, validatedAt: "2026-01-02T00:00:00.000Z", sourceReference: "Décision officielle à référencer" };
    const input = { description: "Médicament", originCountry: "FR", destinationCountry: "SN", declaredValue: 100, asOf: "2026-07-22" };
    expect(evaluateCustomsRules(input, [base])).toHaveLength(1);
    expect(evaluateCustomsRules(input, [{ ...base, status: "draft" }])).toHaveLength(0);
    expect(evaluateCustomsRules({ ...input, destinationCountry: "CI" }, [base])).toHaveLength(0);
  });

  it("labels every Yobalelma duty calculation as indicative", () => {
    const estimate = indicativeDutyEstimate({ taxableBase: 10_000, rate: 0.2, currency: "XOF", source: "Barème à confirmer" });
    expect(estimate).toMatchObject({ amount: 2_000, official: false });
    expect(estimate.disclaimer).toContain("indicative");
  });

  it("locks release, HS validation and duty updates behind controlled database functions", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260722050000_customs_integration_foundation.sql"), "utf8");
    const hardening = readFileSync(resolve(process.cwd(), "supabase/migrations/20260722051000_harden_customs_record_history.sql"), "utf8");
    const countryScope = readFileSync(resolve(process.cwd(), "supabase/migrations/20260722052000_enforce_customs_country_scope.sql"), "utf8");
    expect(sql).toContain("Verified customs release decision required");
    expect(sql).toContain("Self approval is forbidden");
    expect(sql).toContain("Self validation is forbidden");
    expect(sql).toContain("HS classification history is immutable");
    expect(sql).toContain("Verified decision proof required");
    expect(sql).toContain("Controlled customs workflow transition required");
    expect(sql).toContain("for update skip locked");
    expect(hardening).toContain("Customs history cannot be deleted");
    expect(hardening).toContain("Submitted customs records are immutable");
    expect(hardening).toContain("Customs case scope is immutable");
    expect(hardening).not.toContain("for delete");
    expect(countryScope).toContain("created_by=auth.uid()");
    expect(countryScope).toContain("current_user_has_customs_country");
    expect(countryScope).toContain("Rule approval country scope required");
  });

  it("keeps official ingestion and workers restricted to the service role", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260722050000_customs_integration_foundation.sql"), "utf8");
    for (const fn of ["apply_verified_customs_event", "apply_verified_customs_duty", "apply_verified_customs_duty_payment", "claim_customs_outbox", "complete_customs_outbox"]) {
      expect(sql).toContain(`revoke all on function public.${fn}`);
      expect(sql).toMatch(new RegExp(`grant execute on function public\\.${fn}\\([^;]+ to service_role`));
    }
  });

  it("exposes every requested Customs workspace without simulated records", () => {
    const page = readFileSync(resolve(process.cwd(), "apps/admin-app/src/components/customs-pages.tsx"), "utf8");
    const data = readFileSync(resolve(process.cwd(), "apps/admin-app/src/lib/customs-data.ts"), "utf8");
    for (const section of ["dossiers", "declarations", "documents", "marchandises", "inspections", "droits-taxes", "mainlevees", "blocages", "saisies", "commissionnaires", "bureaux", "regles-pays", "codes-hs", "incidents", "audit", "integrations", "statistiques"]) expect(data).toContain(`"${section}"`);
    expect(page).toContain("La connexion officielle n’est pas activée");
    expect(data).not.toContain("mock");
  });
});
