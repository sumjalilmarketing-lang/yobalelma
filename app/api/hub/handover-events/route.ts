import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { assertHandoverChecks } from "@/lib/hub/workflows";
import { callSupabaseRpc } from "@/lib/supabase/rpc";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { hubHandoverEventSchema } from "@/lib/validation/hub";

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, hubHandoverEventSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    assertHandoverChecks(parsed.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Verification remise invalide.", 422);
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour confirmer une remise voyageur.", 401);
  }

  const { data, error } = await callSupabaseRpc<string>(
    supabase,
    "record_hub_handover_event",
    {
      p_batch_id: parsed.data.batchId,
      p_measured_weight_kg: parsed.data.measuredWeightKg ?? null,
      p_note: nullableText(parsed.data.note),
      p_photo_paths: parsed.data.photoPaths ?? [],
      p_signature_path: nullableText(parsed.data.signaturePath),
      p_token_id: nullableText(parsed.data.tokenId),
      p_verified_document: parsed.data.verifiedDocument,
      p_verified_identity: parsed.data.verifiedIdentity,
      p_verified_ticket: parsed.data.verifiedTicket,
    },
  );

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Remise voyageur confirmee.", { handoverEventId: data ?? undefined });
}
