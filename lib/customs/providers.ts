import { z } from "zod";

export const customsStatuses = ["draft", "documents_required", "documents_under_review", "ready_for_submission", "submitted", "accepted", "rejected", "inspection_required", "under_inspection", "additional_information_required", "duties_assessed", "duties_pending_payment", "duties_paid", "release_pending", "released", "suspended", "seized", "returned", "cancelled", "closed"] as const;
export const customsStatusSchema = z.enum(customsStatuses);
export type CustomsStatus = z.infer<typeof customsStatusSchema>;

export const customsCaseInputSchema = z.object({ shipmentId: z.string().uuid(), originCountry: z.string().length(2), destinationCountry: z.string().length(2), regime: z.string().trim().min(1).max(80).nullable(), customsOffice: z.string().trim().max(160).nullable(), brokerId: z.string().uuid().nullable() });
export const customsDocumentSchema = z.object({ customsCaseId: z.string().uuid(), documentType: z.string().trim().min(2).max(80), secureUploadId: z.string().uuid(), checksum: z.string().regex(/^[a-f0-9]{64}$/u) });
export const customsWebhookSchema = z.object({ externalEventId: z.string().trim().min(1).max(200), eventType: z.string().trim().min(1).max(100), occurredAt: z.string().datetime({ offset: true }), payload: z.record(z.string(), z.unknown()) });
export const customsDecisionSchema = z.object({ decisionType: z.enum(["inspection", "release", "rejection", "suspension", "seizure", "return"]), decisionReference: z.string().trim().min(3).max(200), authority: z.string().trim().min(2).max(200), reason: z.string().trim().max(1000).nullable(), effectiveAt: z.string().datetime({ offset: true }), verified: z.boolean(), proofDocumentId: z.string().uuid().nullable() });

export type CustomsCaseInput = z.infer<typeof customsCaseInputSchema>;
export type CustomsWebhook = z.infer<typeof customsWebhookSchema>;
export type CustomsDecision = z.infer<typeof customsDecisionSchema>;

export interface CustomsProvider {
  readonly id: string;
  createCustomsCase(input: CustomsCaseInput): Promise<{ externalReference: string | null }>;
  updateCustomsCase(caseId: string, update: Record<string, unknown>): Promise<void>;
  submitDeclaration(caseId: string): Promise<{ declarationReference: string }>;
  uploadSupportingDocument(input: z.infer<typeof customsDocumentSchema>): Promise<{ externalDocumentReference: string | null }>;
  requestAdditionalDocument(caseId: string, documentType: string, reason: string): Promise<void>;
  calculateIndicativeDuties(caseId: string): Promise<{ amount: number; currency: string; indicative: true }>;
  getDeclarationStatus(caseId: string): Promise<CustomsStatus>;
  processCustomsWebhook(input: { body: string; headers: Headers }): Promise<CustomsWebhook>;
  receiveInspectionDecision(caseId: string): Promise<CustomsDecision>;
  receiveReleaseDecision(caseId: string): Promise<CustomsDecision>;
  suspendShipment(caseId: string, reason: string): Promise<void>;
  releaseShipment(caseId: string, decision: CustomsDecision): Promise<void>;
  closeCustomsCase(caseId: string): Promise<void>;
}

export type OfficialCustomsTransport = { execute(operation: string, payload: unknown): Promise<unknown>; verifyWebhook(body: string, headers: Headers): Promise<unknown> };
export type OfficialCustomsMapping = {
  caseReference(payload: unknown): string | null; declarationReference(payload: unknown): string; status(payload: unknown): CustomsStatus;
  webhook(payload: unknown): CustomsWebhook; decision(payload: unknown): CustomsDecision; dutyEstimate(payload: unknown): { amount: number; currency: string };
};

export class SenegalCustomsProvider implements CustomsProvider {
  readonly id: string = "senegal_customs";
  constructor(private readonly transport?: OfficialCustomsTransport, private readonly mapping?: OfficialCustomsMapping) {}
  private ready() { if (!this.transport || !this.mapping) throw new Error("SENEGAL_CUSTOMS_OFFICIAL_ACCESS_REQUIRED"); return { transport: this.transport, mapping: this.mapping }; }
  async createCustomsCase(input: CustomsCaseInput) { const { transport, mapping } = this.ready(); return { externalReference: mapping.caseReference(await transport.execute("createCustomsCase", customsCaseInputSchema.parse(input))) }; }
  async updateCustomsCase(caseId: string, update: Record<string, unknown>) { await this.ready().transport.execute("updateCustomsCase", { caseId: z.string().uuid().parse(caseId), update }); }
  async submitDeclaration(caseId: string) { const { transport, mapping } = this.ready(); return { declarationReference: mapping.declarationReference(await transport.execute("submitDeclaration", { caseId: z.string().uuid().parse(caseId) })) }; }
  async uploadSupportingDocument(input: z.infer<typeof customsDocumentSchema>) { const { transport, mapping } = this.ready(); return { externalDocumentReference: mapping.caseReference(await transport.execute("uploadSupportingDocument", customsDocumentSchema.parse(input))) }; }
  async requestAdditionalDocument(caseId: string, documentType: string, reason: string) { await this.ready().transport.execute("requestAdditionalDocument", { caseId: z.string().uuid().parse(caseId), documentType, reason }); }
  async calculateIndicativeDuties(caseId: string) { const { transport, mapping } = this.ready(); const result = mapping.dutyEstimate(await transport.execute("calculateIndicativeDuties", { caseId: z.string().uuid().parse(caseId) })); return { ...result, indicative: true as const }; }
  async getDeclarationStatus(caseId: string) { const { transport, mapping } = this.ready(); return customsStatusSchema.parse(mapping.status(await transport.execute("getDeclarationStatus", { caseId: z.string().uuid().parse(caseId) }))); }
  async processCustomsWebhook(input: { body: string; headers: Headers }) { const { transport, mapping } = this.ready(); return customsWebhookSchema.parse(mapping.webhook(await transport.verifyWebhook(input.body, input.headers))); }
  async receiveInspectionDecision(caseId: string) { const { transport, mapping } = this.ready(); return customsDecisionSchema.parse(mapping.decision(await transport.execute("receiveInspectionDecision", { caseId: z.string().uuid().parse(caseId) }))); }
  async receiveReleaseDecision(caseId: string) { const { transport, mapping } = this.ready(); return customsDecisionSchema.parse(mapping.decision(await transport.execute("receiveReleaseDecision", { caseId: z.string().uuid().parse(caseId) }))); }
  async suspendShipment(caseId: string, reason: string) { await this.ready().transport.execute("suspendShipment", { caseId: z.string().uuid().parse(caseId), reason }); }
  async releaseShipment(caseId: string, decision: CustomsDecision) { const parsed = customsDecisionSchema.parse(decision); assertVerifiedRelease(parsed); await this.ready().transport.execute("releaseShipment", { caseId: z.string().uuid().parse(caseId), decision: parsed }); }
  async closeCustomsCase(caseId: string) { await this.ready().transport.execute("closeCustomsCase", { caseId: z.string().uuid().parse(caseId) }); }
}

export class ManualCustomsProvider extends SenegalCustomsProvider { readonly id = "manual_controlled"; }
export class BrokerCustomsProvider extends SenegalCustomsProvider { readonly id = "licensed_broker"; }

export function assertVerifiedRelease(decision: CustomsDecision) {
  if (decision.decisionType !== "release" || !decision.verified || !decision.proofDocumentId || !decision.decisionReference || !decision.authority) throw new Error("VERIFIED_CUSTOMS_RELEASE_REQUIRED");
}
