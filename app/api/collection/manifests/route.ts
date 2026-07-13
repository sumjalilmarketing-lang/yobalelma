import { fail, ok, readJsonRequest, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import {
  collectionManifestItemSchema,
  collectionManifestSchema,
} from "@/lib/validation/collection";

export async function POST(request: Request) {
  const parsedBody = await readJsonRequest(request);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const body: Record<string, unknown> =
    typeof parsedBody.data === "object" && parsedBody.data !== null
      ? (parsedBody.data as Record<string, unknown>)
      : {};
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

    const { error: shipmentError } = await supabase
      .from("shipments")
      .update({ status: "collected_for_hub" })
      .eq("id", parsed.data.shipmentId);

    if (shipmentError) {
      return fail(shipmentError.message, 400);
    }

    const { error: statusError } = await supabase.from("shipment_status_events").insert({
      actor_id: user.id,
      metadata: { collection_manifest_id: parsed.data.manifestId, collection_manifest_item_id: data.id },
      note: "Colis ajoute au manifeste de collecte hub.",
      shipment_id: parsed.data.shipmentId,
      status: "collected_for_hub",
    });

    if (statusError) {
      return fail(statusError.message, 400);
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
