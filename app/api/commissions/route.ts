import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { commissionSchema } from "@/lib/validation/operations";

export async function GET() {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour consulter les commissions.", 401);
  }

  const { data, error } = await supabase
    .from("platform_commissions")
    .select("id, shipment_id, payer_id, beneficiary_id, currency, gross_amount_cents, commission_amount_cents, payout_amount_cents, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Commissions chargees.", { commissions: data });
}

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, commissionSchema);

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
    return fail("Connecte-toi pour calculer une commission.", 401);
  }

  const { data, error } = await supabase.rpc("calculate_platform_commission", {
    p_beneficiary_id: parsed.data.beneficiaryId || undefined,
    p_commission_rate_bps: parsed.data.commissionRateBps,
    p_currency: parsed.data.currency,
    p_gross_amount_cents: parsed.data.grossAmountCents,
    p_payment_intent_id: parsed.data.paymentIntentId,
    p_shipment_id: parsed.data.shipmentId,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Commission calculee.", { commissionId: data });
}
