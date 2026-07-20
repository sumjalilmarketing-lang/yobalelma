import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { canAccessService, requireAdminSession } from "@admin-app/src/lib/auth";
import { canManageMissions } from "@admin-app/src/lib/governance-catalog";
import { assertSameOrigin, rateLimit } from "@admin-app/src/lib/security";
import { missionStatusSchema, missionTransitionSchema, nextMissionStatus } from "@admin-app/src/lib/workflow-engine";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request); rateLimit(request, 40, 60_000);
    const session = await requireAdminSession("/command/missions");
    const payload = missionTransitionSchema.parse(await request.json());
    const { id } = await params;
    const supabase = await tryCreateSupabaseServerClient();
    if (!supabase) return NextResponse.json({ message: "Le service de suivi est momentanément indisponible." }, { status: 503 });
    const client = supabase as SupabaseClient;
    const { data: mission } = await client.from("governance_missions").select("id, status, service_id, assignee_id").eq("id", id).maybeSingle();
    if (!mission || !canAccessService(session, mission.service_id)) return NextResponse.json({ message: "Mission introuvable dans votre périmètre." }, { status: 404 });
    const managerAction = ["assign", "reassign", "request_correction", "validate", "close", "cancel"].includes(payload.action);
    if (managerAction && !canManageMissions(session.roleIds, mission.service_id)) return NextResponse.json({ message: "Cette décision appartient au responsable du service." }, { status: 403 });
    if (!managerAction && mission.assignee_id && mission.assignee_id !== session.userId && !canManageMissions(session.roleIds, mission.service_id)) return NextResponse.json({ message: "Cette mission est attribuée à un autre collaborateur." }, { status: 403 });
    if (["assign", "reassign"].includes(payload.action) && !payload.assigneeId) return NextResponse.json({ message: "Sélectionnez un responsable pour poursuivre." }, { status: 400 });
    if (payload.action === "submit") {
      const { count } = await client.from("governance_mission_proofs").select("id", { count: "exact", head: true }).eq("mission_id", id);
      if (!count && !payload.proofReference) return NextResponse.json({ message: "Ajoutez la preuve d’exécution obligatoire avant de soumettre la mission." }, { status: 400 });
    }
    if (payload.proofReference) await client.from("governance_mission_proofs").insert({ mission_id: id, proof_type: payload.proofType || "activity_report", reference: payload.proofReference, submitted_by: session.userId, submitted_by_name: session.name });
    const current = missionStatusSchema.parse(mission.status);
    const target = nextMissionStatus(current, payload.action);
    const updates: Record<string, unknown> = { status: target, updated_at: new Date().toISOString() };
    if (payload.assigneeId) updates.assignee_id = payload.assigneeId;
    if (payload.assigneeId) {
      const { data: profile } = await client.from("profiles").select("full_name").eq("id", payload.assigneeId).maybeSingle();
      updates.assignee_name = profile?.full_name || "Collaborateur affecté";
    }
    if (target === "in_progress") updates.started_at = new Date().toISOString();
    if (target === "closed") updates.completed_at = new Date().toISOString();
    const { error } = await client.from("governance_missions").update(updates).eq("id", id).eq("status", current);
    if (error) throw error;
    const actionMap: Record<string, string> = { assign: "assigned", reassign: "reassigned", start: "started", submit: "submitted", request_correction: "correction_requested", validate: "validated", close: "closed", cancel: "cancelled" };
    await client.from("governance_mission_events").insert({ mission_id: id, action: actionMap[payload.action], from_status: current, to_status: target, actor_id: session.userId, actor_name: session.name, note: payload.note || null });
    return NextResponse.json({ message: "Décision enregistrée.", status: target });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("workflow") ? error.message : "Cette décision n’a pas pu être enregistrée.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
