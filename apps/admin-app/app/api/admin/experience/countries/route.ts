import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminSession } from "@admin-app/src/lib/auth";
import { countryExperienceDraftSchema } from "@admin-app/src/lib/experience-schemas";
import { assertSameOrigin, rateLimit } from "@admin-app/src/lib/security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); rateLimit(request, 12);
    const session = await getAdminSession();
    if (!session?.roleIds.some((role) => ["super_admin", "admin", "country_manager"].includes(role))) return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
    const parsed = countryExperienceDraftSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Vérifiez les informations saisies." }, { status: 400 });
    const configured = await tryCreateSupabaseServerClient();
    if (!configured) return NextResponse.json({ error: "Le service est momentanément indisponible." }, { status: 503 });
    const client = configured as unknown as SupabaseClient;
    const latest = await client.from("country_experience_configs").select("version").eq("country_code", parsed.data.countryCode).order("version", { ascending: false }).limit(1).maybeSingle();
    const version = Number(latest.data?.version ?? 0) + 1;
    const result = await client.from("country_experience_configs").insert({ country_code: parsed.data.countryCode, version, status: "draft", default_locale: parsed.data.defaultLocale, available_locales: parsed.data.availableLocales, currency_code: parsed.data.currencyCode, time_zone: parsed.data.timeZone, unit_system: parsed.data.unitSystem, created_by: session.userId }).select("id").single();
    if (result.error) return NextResponse.json({ error: "La version n’a pas pu être préparée." }, { status: 409 });
    await client.from("ad_change_log").insert({ entity_type: "country_experience", entity_id: result.data.id, action: "draft_created", actor_id: session.userId, summary: { country_code: parsed.data.countryCode, version } });
    return NextResponse.json({ version }, { status: 201 });
  } catch { return NextResponse.json({ error: "La demande n’a pas pu être traitée." }, { status: 400 }); }
}
