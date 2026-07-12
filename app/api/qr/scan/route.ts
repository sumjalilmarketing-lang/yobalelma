import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { extractHandoverQrToken } from "@/lib/qr/payload";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { scanQrTokenSchema } from "@/lib/validation/qr";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, scanQrTokenSchema);

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
    return fail("Connecte-toi pour scanner un QR.", 401);
  }

  let token: string;

  try {
    token = extractHandoverQrToken(parsed.data.token);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Payload QR invalide.", 422);
  }

  const { data, error } = await supabase.rpc("scan_handover_qr_token", {
    p_expected_token_type: parsed.data.expectedTokenType,
    p_incident_type: parsed.data.incidentType || undefined,
    p_note: parsed.data.note || undefined,
    p_token: token,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("QR scanne et invalide.", { result: data?.[0] ?? null });
}
