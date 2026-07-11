import { fail, ok, readJsonRequest, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { hubInspectionSchema } from "@/lib/validation/hub";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await readJsonRequest(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = hubInspectionSchema.safeParse({
    ...(typeof body.data === "object" && body.data !== null ? body.data : {}),
    batchId: id,
  });

  if (!parsed.success) {
    return validationFail(parsed.error);
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour inspecter un colis au hub.", 401);
  }

  const { data, error } = await supabase
    .from("hub_package_inspections")
    .insert({
      batch_id: parsed.data.batchId || null,
      decision: parsed.data.decision,
      inspector_id: user.id,
      measured_weight_kg: parsed.data.measuredWeightKg ?? null,
      note: parsed.data.note || null,
      photo_path: parsed.data.photoPath || null,
      shipment_id: parsed.data.shipmentId,
      storage_location: parsed.data.storageLocation || null,
    })
    .select("id")
    .single();

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Inspection hub enregistree.", { inspectionId: data.id });
}
