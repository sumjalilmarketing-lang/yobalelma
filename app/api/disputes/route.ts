import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { shipmentDisputeSchema } from "@/lib/validation/operations";

export async function GET() {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour consulter les litiges.", 401);
  }

  const { data, error } = await supabase
    .from("shipment_disputes")
    .select("id, shipment_id, category, status, subject, description, resolution, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Litiges charges.", { disputes: data });
}

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, shipmentDisputeSchema);

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
    return fail("Connecte-toi pour ouvrir un litige.", 401);
  }

  const { data, error } = await supabase.rpc("create_shipment_dispute", {
    p_category: parsed.data.category,
    p_description: parsed.data.description,
    p_evidence_bucket: parsed.data.evidenceBucket || null,
    p_evidence_path: parsed.data.evidencePath || null,
    p_shipment_id: parsed.data.shipmentId,
    p_subject: parsed.data.subject,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Litige ouvert.", { disputeId: data });
}
