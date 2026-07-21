import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminSession } from "@admin-app/src/lib/auth";
import { advertiserDraftSchema } from "@admin-app/src/lib/experience-schemas";
import { assertSameOrigin, rateLimit } from "@admin-app/src/lib/security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); rateLimit(request, 12);
    const session = await getAdminSession();
    if (!session?.roleIds.some((role) => ["super_admin", "admin", "partner_manager"].includes(role))) return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
    const parsed = advertiserDraftSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Vérifiez les informations saisies." }, { status: 400 });
    const configured = await tryCreateSupabaseServerClient();
    if (!configured) return NextResponse.json({ error: "Le service est momentanément indisponible." }, { status: 503 });
    const client = configured as unknown as SupabaseClient;
    const result = await client.from("advertisers").insert({ legal_name: parsed.data.legalName, display_name: parsed.data.displayName, billing_country: parsed.data.billingCountry, allowed_domains: parsed.data.allowedDomains, status: "draft", created_by: session.userId }).select("id").single();
    if (result.error) return NextResponse.json({ error: "L’annonceur n’a pas pu être enregistré." }, { status: 409 });
    await client.from("ad_change_log").insert({ entity_type: "advertiser", entity_id: result.data.id, action: "draft_created", actor_id: session.userId, summary: { display_name: parsed.data.displayName } });
    return NextResponse.json({ status: "draft" }, { status: 201 });
  } catch { return NextResponse.json({ error: "La demande n’a pas pu être traitée." }, { status: 400 }); }
}
