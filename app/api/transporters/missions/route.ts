import { fail, ok } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour consulter tes missions.", 401);
  }

  const { data, error } = await supabase
    .from("local_delivery_missions")
    .select("id, shipment_id, status, score, reason, offered_at, accepted_at, picked_up_at, delivered_at, shipments(tracking_code, origin_city, origin_country, destination_city, destination_country, status)")
    .eq("transporter_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Missions chargees.", { missions: data ?? [] });
}
