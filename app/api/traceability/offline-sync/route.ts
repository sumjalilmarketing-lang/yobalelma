import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { offlineTraceabilityBatchSchema, toTraceabilityRpcPayload } from "@/lib/validation/traceability";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, offlineTraceabilityBatchSchema, { maxBytes: 1024 * 1024 });
  if (!parsed.ok) return parsed.response;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return fail("Synchronisation indisponible.", 503);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Authentification requise.", 401);
  const client = supabase as unknown as SupabaseClient;
  const results: Array<{ idempotencyKey: string; status: "synchronized" | "rejected" | "conflict"; eventId?: string; reason?: string }> = [];
  for (const event of parsed.data.events) {
    const { data, error } = await client.rpc("record_parcel_traceability_event", { p_payload: toTraceabilityRpcPayload({ ...event, applicationSource: "offline-sync", eventSource: "offline_sync" }) });
    if (error) {
      const conflict = /mismatch|already|duplicate|transition/i.test(error.message);
      results.push({ idempotencyKey: event.idempotencyKey, status: conflict ? "conflict" : "rejected", reason: error.message });
    } else results.push({ idempotencyKey: event.idempotencyKey, status: "synchronized", eventId: String(data) });
  }
  return ok("Synchronisation traitee sans masquer les rejets.", { results });
}
