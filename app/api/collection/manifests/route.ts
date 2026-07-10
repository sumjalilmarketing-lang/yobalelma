import { fail, ok, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import {
  collectionManifestItemSchema,
  collectionManifestSchema,
} from "@/lib/validation/collection";

export async function POST(request: Request) {
  const body = await request.json();
  const mode = typeof body.mode === "string" ? body.mode : "manifest";
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour gerer les manifestes.", 401);
  }

  if (mode === "item") {
    const parsed = collectionManifestItemSchema.safeParse(body);

    if (!parsed.success) {
      return validationFail(parsed.error);
    }

    const { data, error } = await supabase
      .from("collection_manifest_items")
      .insert({
        incident_note: parsed.data.incidentNote || null,
        manifest_id: parsed.data.manifestId,
        shipment_id: parsed.data.shipmentId,
      })
      .select("id")
      .single();

    if (error) {
      return fail(error.message, 400);
    }

    return ok("Colis ajoute au manifeste.", { itemId: data.id });
  }

  const parsed = collectionManifestSchema.safeParse(body);

  if (!parsed.success) {
    return validationFail(parsed.error);
  }

  const { data, error } = await supabase
    .from("collection_manifests")
    .insert({
      code: parsed.data.code,
      route_id: parsed.data.routeId,
      sealed_by: user.id,
      sealed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Manifeste cree et scelle.", { manifestId: data.id });
}
