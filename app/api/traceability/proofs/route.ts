import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { traceabilityProofSchema } from "@/lib/validation/traceability";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, traceabilityProofSchema);
  if (!parsed.ok) return parsed.response;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return fail("Le service de preuve est indisponible.", 503);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Authentification requise.", 401);
  const value = parsed.data;
  const payload = Object.fromEntries(Object.entries({ parcel_id: value.parcelId, proof_type: value.proofType, proof_hash: value.proofHash.toLowerCase(), storage_bucket: value.storageBucket, storage_path: value.storagePath, captured_at: value.capturedAt, device_id: value.deviceId, latitude: value.latitude, longitude: value.longitude, metadata: value.metadata }).filter(([, item]) => item !== undefined));
  const { data, error } = await (supabase as unknown as SupabaseClient).rpc("register_parcel_traceability_proof", { p_payload: payload });
  if (error) return fail(error.message, 409);
  return ok("Preuve enregistree et placee en verification.", { proofId: data });
}
