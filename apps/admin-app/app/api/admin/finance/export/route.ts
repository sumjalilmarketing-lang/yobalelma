import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAdminSession } from "@admin-app/src/lib/auth";
import { canAccessFinance } from "@admin-app/src/lib/finance-data";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@admin-app/src/lib/security";

export async function GET(request: Request) {
  try {
    rateLimit(request, 8, 60_000);
    const session = await getAdminSession();
    if (!session || !canAccessFinance(session)) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    const supabase = await tryCreateSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "Export indisponible." }, { status: 503 });
    const db = supabase as SupabaseClient;
    const { data, error } = await db.from("payments").select("internal_reference, provider_transaction_id, shipment_id, customer_id, provider, amount, currency, status, country_code, confirmed_at, created_at").order("created_at", { ascending: false }).limit(10_000);
    if (error) return NextResponse.json({ error: "Export indisponible." }, { status: 503 });
    const columns = ["reference_interne", "reference_fournisseur", "colis", "client", "fournisseur", "montant_mineur", "devise", "statut", "pays", "confirme_le", "cree_le"];
    const csv = [columns, ...(data ?? []).map((row) => [row.internal_reference, row.provider_transaction_id, row.shipment_id, row.customer_id, row.provider, row.amount, row.currency, row.status, row.country_code, row.confirmed_at, row.created_at])]
      .map((row) => row.map(csvCell).join(",")).join("\r\n");
    return new NextResponse(`\uFEFF${csv}`, { headers: { "cache-control": "no-store", "content-disposition": `attachment; filename="yobalelma-paiements-${new Date().toISOString().slice(0, 10)}.csv"`, "content-type": "text/csv; charset=utf-8", "x-content-type-options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "Export indisponible." }, { status: 429 });
  }
}

function csvCell(value: unknown) {
  const raw = value == null ? "" : String(value);
  const safe = /^[=+@-]/u.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}
