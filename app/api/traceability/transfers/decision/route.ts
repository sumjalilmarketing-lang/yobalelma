import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { traceabilityTransferDecisionSchema } from "@/lib/validation/traceability";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Origine de la demande non autorisée.", 403);
  const parsed = await parseJsonRequest(request, traceabilityTransferDecisionSchema);
  if (!parsed.ok) return parsed.response;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return fail("Le service de transfert est indisponible.", 503);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Authentification requise.", 401);
  const value = parsed.data;
  const { data, error } = await (supabase as unknown as SupabaseClient).rpc("decide_parcel_custody_transfer", {
    p_decision: value.decision,
    p_decision_idempotency_key: value.decisionIdempotencyKey,
    p_latitude: value.latitude,
    p_longitude: value.longitude,
    p_rejection_reason: value.rejectionReason,
    p_transfer_id: value.transferId,
  });
  if (error) return fail(error.message, 409);
  return ok(value.decision === "confirm" ? "Transfert confirmé par le receveur." : "Transfert refusé sans changement de détenteur.", { eventId: data, actorId: user.id });
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || new URL(origin).host === new URL(request.url).host;
}
