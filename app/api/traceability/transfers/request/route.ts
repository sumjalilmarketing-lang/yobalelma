import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { traceabilityTransferRequestSchema } from "@/lib/validation/traceability";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Origine de la demande non autorisée.", 403);
  const parsed = await parseJsonRequest(request, traceabilityTransferRequestSchema);
  if (!parsed.ok) return parsed.response;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return fail("Le service de transfert est indisponible.", 503);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Authentification requise.", 401);
  if (user.id !== parsed.data.giverActorId) return fail("Le remettant ne correspond pas à la session.", 403);
  const value = parsed.data;
  const payload = Object.fromEntries(Object.entries({
    application_source: value.applicationSource,
    device_id: value.deviceId,
    expires_at: value.expiresAt,
    giver_actor_id: value.giverActorId,
    latitude: value.latitude,
    location_accuracy: value.locationAccuracy,
    longitude: value.longitude,
    metadata: value.metadata,
    mission_id: value.missionId,
    new_custodian_id: value.newCustodianId,
    new_custodian_type: value.newCustodianType,
    new_location_id: value.newLocationId,
    parcel_id: value.parcelId,
    previous_custodian_id: value.previousCustodianId,
    proof_ids: value.proofIds,
    receiver_actor_id: value.receiverActorId,
    recorded_by_role: value.recordedByRole,
    request_idempotency_key: value.requestIdempotencyKey,
    stage_after: value.stageAfter,
    vehicle_id: value.vehicleId,
  }).filter(([, item]) => item !== undefined));
  const { data, error } = await (supabase as unknown as SupabaseClient).rpc("request_parcel_custody_transfer", { p_payload: payload });
  if (error) return fail(error.message, 409);
  return ok("Première validation enregistrée. Le détenteur reste inchangé jusqu’à la confirmation du receveur.", { transferId: data });
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || new URL(origin).host === new URL(request.url).host;
}
