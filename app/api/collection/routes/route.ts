import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { collectionRouteSchema } from "@/lib/validation/collection";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, collectionRouteSchema);

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
    return fail("Connecte-toi pour creer une tournee.", 401);
  }

  const { data, error } = await supabase
    .from("collection_routes")
    .insert({
      created_by: user.id,
      driver_id: parsed.data.driverId || null,
      name: parsed.data.name,
      route_date: parsed.data.routeDate,
      status: "planned",
    })
    .select("id")
    .single();

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Tournee creee.", { routeId: data.id });
}
