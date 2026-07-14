import { fail, ok, readJsonRequest, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { collectionStopSchema } from "@/lib/validation/collection";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await readJsonRequest(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = collectionStopSchema.safeParse({
    ...(typeof body.data === "object" && body.data !== null ? body.data : {}),
    routeId: id,
  });

  if (!parsed.success) {
    return validationFail(parsed.error);
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour modifier la tournee.", 401);
  }

  const { data, error } = await supabase
    .from("collection_route_stops")
    .insert({
      relay_point_id: parsed.data.relayPointId,
      route_id: parsed.data.routeId,
      stop_order: parsed.data.stopOrder,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Arret ajoute a la tournee.", { stopId: data.id });
}
