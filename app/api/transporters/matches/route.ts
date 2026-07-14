import { fail, ok } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

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
    return fail("Connecte-toi pour consulter les missions compatibles.", 401);
  }

  const { data, error } = await supabase.rpc("find_local_transporter_matches", {
    p_shipment_id: shipmentId,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Missions compatibles calculees.", { matches: data ?? [] });
}
