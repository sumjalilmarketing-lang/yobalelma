import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { callSupabaseRpc } from "@/lib/supabase/rpc";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { manualCorrectionSchema } from "@/lib/validation/final-delivery";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, manualCorrectionSchema);

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
    return fail("Connecte-toi pour creer une correction manuelle.", 401);
  }

  const { data, error } = await callSupabaseRpc<string>(
    supabase,
    "create_manual_correction",
    {
      p_action: parsed.data.action,
      p_comment: parsed.data.comment,
      p_entity_id: parsed.data.entityId,
      p_entity_type: parsed.data.entityType,
      p_new_value: parsed.data.newValue,
      p_old_value: parsed.data.oldValue,
      p_permission_key: parsed.data.permissionKey,
      p_reason: parsed.data.reason,
      p_requires_second_approval: parsed.data.requiresSecondApproval,
    },
  );

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Correction manuelle auditée.", { correctionId: data });
}
