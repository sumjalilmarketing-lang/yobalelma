import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { toTraceabilityRpcPayload, traceabilityEventSchema } from "@/lib/validation/traceability";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, traceabilityEventSchema);
  if (!parsed.ok) return parsed.response;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return fail("Le service de tracabilite est indisponible.", 503);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Authentification requise.", 401);

  const { data, error } = await (supabase as unknown as SupabaseClient).rpc("record_parcel_traceability_event", { p_payload: toTraceabilityRpcPayload(parsed.data) });
  if (error) return fail(error.message, 409);
  return ok("Evenement de tracabilite enregistre.", { eventId: data });
}
