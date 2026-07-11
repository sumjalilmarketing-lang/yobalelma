import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { createQrTokenSchema } from "@/lib/validation/qr";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, createQrTokenSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour generer un QR.", 401);
  }

  const { data, error } = await supabase.rpc("create_handover_qr_token", {
    p_batch_id: parsed.data.batchId,
    p_expires_in_minutes: parsed.data.expiresInMinutes,
    p_token_type: parsed.data.tokenType,
  });

  if (error) {
    return fail(error.message, 400);
  }

  const token = data?.[0];

  if (!token) {
    return fail("QR non genere.", 500);
  }

  return ok("QR genere.", token);
}
