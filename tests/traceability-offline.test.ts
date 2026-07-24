import { describe, expect, it } from "vitest";
import { enqueueTraceabilityEvent, markPending, reconcileOfflineTraceability } from "@/lib/traceability/offline-queue";
import type { TraceabilityEventInput } from "@/lib/validation/traceability";

const event = (key: string, occurredAt: string): TraceabilityEventInput => ({ parcelId: "11111111-1111-4111-8111-111111111111", eventType: "parcel_collected", stageAfter: "with_collection_driver", countryCode: "SN", recordedByRole: "collection_driver", applicationSource: "collection-app", eventSource: "scan", proofIds: [], parcelCondition: "intact", idempotencyKey: key.repeat(12).slice(0, 12), metadata: {}, occurredAt });

describe("offline traceability queue", () => {
  it("deduplicates and preserves chronological order", () => {
    const later=event("b","2026-07-22T11:00:00Z"); const earlier=event("a","2026-07-22T10:00:00Z");
    const queue=enqueueTraceabilityEvent(enqueueTraceabilityEvent(enqueueTraceabilityEvent([],later),earlier),earlier);
    expect(queue.map((item)=>item.event.idempotencyKey)).toEqual([earlier.idempotencyKey,later.idempotencyKey]);
  });
  it("does not invent success for missing or rejected responses", () => {
    const queued=markPending([ { event:event("a","2026-07-22T10:00:00Z"), status:"local", attempts:0 }, { event:event("b","2026-07-22T11:00:00Z"), status:"local", attempts:0 } ]);
    const result=reconcileOfflineTraceability(queued,[{idempotencyKey:queued[0].event.idempotencyKey,status:"rejected",reason:"proof missing"}]);
    expect(result.map((item)=>item.status)).toEqual(["rejected","pending"]); expect(result[0].lastError).toBe("proof missing");
  });
});
