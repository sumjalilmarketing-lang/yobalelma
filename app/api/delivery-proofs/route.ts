import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { deliveryProofSchema } from "@/lib/validation/operations";

export async function GET(request: Request) {
  const shipmentId = new URL(request.url).searchParams.get("shipmentId");

  if (!shipmentId) {
    return fail("shipmentId est requis.", 400);
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour consulter les preuves.", 401);
  }

  const { data, error } = await supabase
    .from("delivery_proofs")
    .select("id, shipment_id, mission_id, proof_type, storage_bucket, storage_path, otp_confirmed, captured_at, created_at")
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: false });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Preuves de livraison chargees.", { proofs: data });
}

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, deliveryProofSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour ajouter une preuve de livraison.", 401);
  }

  const { data, error } = await supabase.rpc("record_delivery_proof", {
    p_handover_qr_token_id: parsed.data.handoverQrTokenId || undefined,
    p_metadata: {},
    p_mission_id: parsed.data.missionId || undefined,
    p_otp_confirmed: parsed.data.otpConfirmed,
    p_proof_type: parsed.data.proofType,
    p_recipient_name: parsed.data.recipientName || undefined,
    p_recipient_phone_last4: parsed.data.recipientPhoneLast4 || undefined,
    p_shipment_id: parsed.data.shipmentId,
    p_storage_bucket: parsed.data.storageBucket || undefined,
    p_storage_path: parsed.data.storagePath || undefined,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Preuve de livraison enregistree.", { proofId: data });
}
