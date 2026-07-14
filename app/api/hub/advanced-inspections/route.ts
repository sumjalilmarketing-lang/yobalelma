import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { evaluateWeightTolerance } from "@/lib/hub/workflows";
import { callSupabaseRpc } from "@/lib/supabase/rpc";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { hubAdvancedInspectionSchema } from "@/lib/validation/hub";

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, hubAdvancedInspectionSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const tolerance =
    parsed.data.declaredWeightKg && parsed.data.declaredWeightKg > 0
      ? evaluateWeightTolerance({
          declaredWeightKg: parsed.data.declaredWeightKg,
          measuredWeightKg: parsed.data.measuredWeightKg,
        })
      : null;

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour inspecter un colis au hub.", 401);
  }

  const note = [
    nullableText(parsed.data.note),
    tolerance?.requiresIncident
      ? `Tolerance poids: ${tolerance.variancePercent.toFixed(2)}%.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  const { data, error } = await callSupabaseRpc<string>(
    supabase,
    "record_hub_inspection",
    {
      p_decision: parsed.data.decision,
      p_hub_id: parsed.data.hubId,
      p_measured_dimensions: parsed.data.measuredDimensionsCm ?? {},
      p_measured_weight_kg: parsed.data.measuredWeightKg,
      p_note: nullableText(note),
      p_package_condition: parsed.data.packageCondition,
      p_packaging_compliant: parsed.data.packagingCompliant,
      p_photo_paths: parsed.data.photoPaths ?? [],
      p_shipment_id: parsed.data.shipmentId,
    },
  );

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Inspection hub avancee enregistree.", {
    inspectionId: data ?? undefined,
    tolerance,
  });
}
