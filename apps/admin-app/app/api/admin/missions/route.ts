import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminSession } from "@admin-app/src/lib/auth";
import { canManageMissions, getGovernanceService } from "@admin-app/src/lib/governance-catalog";
import { assertSameOrigin, rateLimit } from "@admin-app/src/lib/security";
import { missionCreateSchema } from "@admin-app/src/lib/workflow-engine";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); rateLimit(request, 25, 60_000);
    const session = await requireAdminSession("/command/missions");
    const payload = missionCreateSchema.parse(await request.json());
    if (!canManageMissions(session.roleIds, payload.serviceId)) return NextResponse.json({ message: "Vous ne pouvez pas créer une mission pour ce service." }, { status: 403 });
    const service = getGovernanceService(payload.serviceId);
    if (!service) return NextResponse.json({ message: "Le service sélectionné n’est pas disponible." }, { status: 400 });
    const supabase = await tryCreateSupabaseServerClient();
    if (!supabase) return NextResponse.json({ message: "Le service de suivi est momentanément indisponible." }, { status: 503 });
    const client = supabase as SupabaseClient;
    const reference = `YB-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const dueAt = payload.dueAt || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    const { data, error } = await client.from("governance_missions").insert({
      reference, title: payload.title, description: payload.description, workflow_key: payload.workflowKey,
      direction_id: service.directionId, service_id: service.id, status: payload.assigneeId ? "assigned" : "draft",
      priority: payload.priority, creator_id: session.userId, creator_name: session.name,
      assignee_id: payload.assigneeId ?? null, due_at: dueAt, country_code: payload.countryCode,
      region_code: payload.regionCode ?? null, organization_id: payload.organizationId ?? null,
      hub_id: payload.hubId ?? null, relay_point_id: payload.relayPointId ?? null,
      team_id: payload.teamId ?? null, operational_zone_id: payload.operationalZoneId ?? null,
    }).select("id").single();
    if (error || !data) throw error ?? new Error("mission missing");
    await client.from("governance_mission_events").insert({ mission_id: data.id, action: "created", actor_id: session.userId, actor_name: session.name, note: "Mission créée dans le centre de commandement." });
    return NextResponse.json({ id: data.id, message: "Mission créée." }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "La mission n’a pas pu être créée. Vérifiez les informations puis réessayez." }, { status: 400 });
  }
}
