import { z } from "zod";

const telemetryValueSchema = z.union([z.string().max(500), z.number(), z.boolean(), z.null()]);
export const telemetryEventSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_.-]{2,100}$/u), occurredAt: z.string().datetime({ offset: true }),
  traceId: z.string().regex(/^[a-f0-9]{32}$/u), spanId: z.string().regex(/^[a-f0-9]{16}$/u), severity: z.enum(["info", "warn", "error"]),
  attributes: z.record(z.string().max(80), telemetryValueSchema).default({}),
});
export type TelemetryEvent = z.infer<typeof telemetryEventSchema>;
export const operationalAlertSchema = z.object({
  deduplicationKey: z.string().regex(/^[A-Za-z0-9:_-]{8,160}$/u), title: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(3).max(1000), severity: z.enum(["warning", "critical"]),
  occurredAt: z.string().datetime({ offset: true }), runbookUrl: z.string().url().max(500),
});
export type OperationalAlert = z.infer<typeof operationalAlertSchema>;
export interface ObservabilityProvider { readonly id: string; emit(event: TelemetryEvent): Promise<void>; flush(): Promise<void>; }
export interface OnCallAlertProvider { readonly id: string; notify(alert: OperationalAlert): Promise<{ reference: string }> }
export type ObservabilityTransport = (event: TelemetryEvent) => Promise<void>;
export class ExternalObservabilityProvider implements ObservabilityProvider {
  constructor(readonly id: string, private readonly transport?: ObservabilityTransport) {}
  async emit(event: TelemetryEvent) { if (!this.transport) throw new Error("OBSERVABILITY_PROVIDER_ACCESS_REQUIRED"); await this.transport(redactTelemetryEvent(telemetryEventSchema.parse(event))); }
  async flush() {}
}
export class ExternalOnCallAlertProvider implements OnCallAlertProvider {
  constructor(readonly id: string, private readonly transport?: (alert: OperationalAlert) => Promise<{ reference: string }>) {}
  async notify(alert: OperationalAlert) {
    if (!this.transport) throw new Error("ON_CALL_PROVIDER_ACCESS_REQUIRED");
    const result = await this.transport(operationalAlertSchema.parse(alert));
    if (!result.reference) throw new Error("ON_CALL_PROVIDER_INVALID_RECEIPT");
    return result;
  }
}
export function redactTelemetryEvent(event: TelemetryEvent): TelemetryEvent {
  return { ...event, attributes: Object.fromEntries(Object.entries(event.attributes).map(([key, value]) => [key, typeof value === "string" ? redact(value) : value])) };
}
function redact(value: string) { return value.replace(/Bearer\s+\S+/giu, "Bearer [redacted]").replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/gu, "jwt_[redacted]").replace(/sb(?:p|_secret)_[A-Za-z0-9_-]+/gu, "sb_[redacted]").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, "[email]").replace(/\b(?:\d[ -]?){13,19}\b/gu, "[payment-data]"); }
