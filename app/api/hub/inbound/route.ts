import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { summarizeManifest } from "@/lib/hub/workflows";
import { callSupabaseRpc } from "@/lib/supabase/rpc";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { hubInboundReceiptSchema } from "@/lib/validation/hub";

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, hubInboundReceiptSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const manifestSummary = summarizeManifest(
    parsed.data.items.map((item) => ({
      note: item.note,
      status: item.status,
    })),
  );

  if (!manifestSummary.canConfirm) {
    return fail("Les ecarts de manifeste doivent etre justifies avant confirmation.", 422);
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour receptionner un manifeste hub.", 401);
  }

  const { data, error } = await callSupabaseRpc<string>(
    supabase,
    "receive_hub_manifest",
    {
      p_hub_id: parsed.data.hubId,
      p_items: parsed.data.items.map((item) => ({
        note: nullableText(item.note),
        photo_paths: item.photoPaths ?? [],
        shipment_id: nullableText(item.shipmentId),
        status: item.status,
        tracking_code: item.trackingCode,
      })),
      p_manifest_id: nullableText(parsed.data.manifestId),
      p_note: nullableText(parsed.data.notes),
    },
  );

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Manifeste hub receptionne.", {
    receiptId: data ?? undefined,
    summary: manifestSummary,
  });
}
