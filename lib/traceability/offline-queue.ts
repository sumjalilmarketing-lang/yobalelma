import type { TraceabilityEventInput } from "@/lib/validation/traceability";

export type OfflineTraceabilityItem = {
  event: TraceabilityEventInput;
  status: "local" | "pending" | "synchronized" | "rejected" | "conflict";
  attempts: number;
  lastError?: string;
};

export type OfflineSyncResult = { idempotencyKey: string; status: "synchronized" | "rejected" | "conflict"; reason?: string };

export function enqueueTraceabilityEvent(queue: readonly OfflineTraceabilityItem[], event: TraceabilityEventInput) {
  if (queue.some((item) => item.event.idempotencyKey === event.idempotencyKey)) return [...queue];
  return [...queue, { event, status: "local" as const, attempts: 0 }].sort((a, b) => new Date(a.event.occurredAt ?? 0).getTime() - new Date(b.event.occurredAt ?? 0).getTime());
}

export function markPending(queue: readonly OfflineTraceabilityItem[]) {
  return queue.map((item) => item.status === "local" ? { ...item, status: "pending" as const, attempts: item.attempts + 1 } : item);
}

export function reconcileOfflineTraceability(queue: readonly OfflineTraceabilityItem[], results: readonly OfflineSyncResult[]) {
  const byKey = new Map(results.map((result) => [result.idempotencyKey, result]));
  return queue.map((item) => {
    const result = byKey.get(item.event.idempotencyKey);
    return result ? { ...item, status: result.status, lastError: result.reason } : item;
  });
}
