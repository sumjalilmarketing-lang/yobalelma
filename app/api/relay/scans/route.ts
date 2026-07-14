import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { relayScanSchema } from "@/lib/validation/relay";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, relayScanSchema);

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
    return fail("Connecte-toi pour scanner un colis.", 401);
  }

  const { data, error } = await supabase.rpc("record_relay_scan", {
    p_note: parsed.data.note || undefined,
    p_relay_point_id: parsed.data.relayPointId,
    p_scan_type: parsed.data.scanType,
    p_tracking_code: parsed.data.trackingCode,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Scan relais enregistre.", { scanId: data });
}
