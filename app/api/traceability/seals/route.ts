import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, readJsonRequest, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { parcelSealActionSchema } from "@/lib/validation/traceability";

export async function POST(request: Request) {
  const parsedBody = await readJsonRequest(request);
  if (!parsedBody.ok) return parsedBody.response;
  const parsed = parcelSealActionSchema.safeParse(parsedBody.data);
  if (!parsed.success) return validationFail(parsed.error);
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return fail("Le service de traçabilité est indisponible.", 503);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Authentification requise.", 401);
  const client = supabase as unknown as SupabaseClient;
  const { data, error } = await client.rpc("record_parcel_seal_action", {
    p_action: parsed.data.action, p_authorized: parsed.data.authorized, p_idempotency_key: parsed.data.idempotencyKey,
    p_location_id: parsed.data.locationId, p_parcel_id: parsed.data.parcelId, p_photo_proof_id: parsed.data.photoProofId,
    p_reason: parsed.data.reason ?? null, p_seal_hash: parsed.data.sealHash.toLowerCase(),
  });
  if (error) return fail("L’action sur le scellé a été refusée.", 409);
  return ok("Action sur le scellé enregistrée.", { sealId: data });
}
