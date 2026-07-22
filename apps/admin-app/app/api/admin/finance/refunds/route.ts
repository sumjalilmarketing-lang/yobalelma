import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAdminSession } from "@admin-app/src/lib/auth";
import { canAccessFinance } from "@admin-app/src/lib/finance-data";
import { assertSameOrigin, requireIdempotencyKey } from "@/lib/payments/security";
import { validateRefund } from "@/lib/payments/policies";
import { tryCreateSupabaseServiceClient } from "@/lib/supabase/service";
import { refundRequestSchema } from "@/lib/validation/operations";
import { rateLimit } from "@admin-app/src/lib/security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    rateLimit(request, 12, 60_000);
    const idempotencyKey = requireIdempotencyKey(request);
    const session = await getAdminSession();
    if (!session || !canAccessFinance(session) || !session.roleIds.some((role) => ["super_admin", "admin", "finance_manager", "refund_agent"].includes(role))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    const parsed = refundRequestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Demande de remboursement invalide." }, { status: 422 });
    const service = tryCreateSupabaseServiceClient();
    if (!service) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });
    const db = service as SupabaseClient;
    const { data: payment } = await db.from("payments").select("id, amount, status").eq("id", parsed.data.paymentId).maybeSingle();
    if (!payment) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
    const { data: existing } = await db.from("refunds").select("id, amount, status").eq("payment_id", payment.id);
    const alreadyRefunded = (existing ?? []).filter((item) => ["pending", "succeeded"].includes(item.status)).reduce((sum, item) => sum + item.amount, 0);
    validateRefund({ amount: parsed.data.amount, alreadyRefunded, paymentAmount: payment.amount, paymentStatus: payment.status });
    const { data: refund, error } = await db.from("refunds").insert({ amount: parsed.data.amount, created_by: session.userId, idempotency_key: idempotencyKey, payment_id: payment.id, reason: parsed.data.reason, status: "created" }).select("id, status").single();
    if (error || !refund) return NextResponse.json({ error: "Demande déjà enregistrée ou invalide." }, { status: 409 });
    return NextResponse.json({ message: "Demande enregistrée. Une autre personne autorisée doit la valider.", refund });
  } catch {
    return NextResponse.json({ error: "La demande n’a pas pu être enregistrée." }, { status: 400 });
  }
}
