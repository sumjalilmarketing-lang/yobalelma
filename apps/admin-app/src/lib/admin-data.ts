import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { canAccessService } from "./auth";
import type { AdminSession, AuditSummary, MissionSummary, TeamMemberSummary } from "./types";

export async function loadCommandData(session: AdminSession) {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { missions: [] as MissionSummary[], audit: [] as AuditSummary[], staff: [] as TeamMemberSummary[], sourceReady: false };
  const client = supabase as SupabaseClient;
  const [missionsResult, auditResult, staffResult] = await Promise.all([
    client.from("governance_missions").select("id, reference, title, description, service_id, direction_id, status, priority, assignee_name, due_at, created_at").order("created_at", { ascending: false }).limit(150),
    client.from("governance_mission_events").select("id, mission_id, action, actor_name, note, created_at").order("created_at", { ascending: false }).limit(80),
    client.from("governance_staff_assignments").select("id, display_name, email, role_id, direction_id, service_id, country_code, region_code").eq("active", true).order("display_name").limit(250),
  ]);
  const missions = (missionsResult.data ?? []).filter((item) => canAccessService(session, item.service_id)).map((item) => ({
    id: item.id, reference: item.reference, title: item.title, description: item.description,
    serviceId: item.service_id, directionId: item.direction_id, status: item.status, priority: item.priority,
    assigneeName: item.assignee_name, dueAt: item.due_at, createdAt: item.created_at,
  }));
  const missionIds = new Set(missions.map((item) => item.id));
  const audit = (auditResult.data ?? []).filter((item) => !item.mission_id || missionIds.has(item.mission_id)).map((item) => ({
    id: item.id, missionId: item.mission_id, action: item.action, actorName: item.actor_name,
    note: item.note, createdAt: item.created_at,
  }));
  const staff = (staffResult.data ?? []).filter((item) => canAccessService(session, item.service_id)).map((item) => ({
    id: item.id, name: item.display_name, email: item.email, roleId: item.role_id,
    directionId: item.direction_id, serviceId: item.service_id, countryCode: item.country_code,
    regionCode: item.region_code,
  }));
  return { missions, audit, staff, sourceReady: !missionsResult.error && !auditResult.error && !staffResult.error };
}

export async function loadMissionDetail(session: AdminSession, missionId: string) {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return null;
  const client = supabase as SupabaseClient;
  const { data } = await client.from("governance_missions").select("id, reference, title, description, service_id, direction_id, status, priority, assignee_name, due_at, created_at").eq("id", missionId).maybeSingle();
  if (!data || !canAccessService(session, data.service_id)) return null;
  const [{ data: events }, { data: proofs }] = await Promise.all([
    client.from("governance_mission_events").select("id, action, actor_name, note, created_at").eq("mission_id", missionId).order("created_at", { ascending: false }),
    client.from("governance_mission_proofs").select("id, proof_type, reference, submitted_by_name, created_at").eq("mission_id", missionId).order("created_at", { ascending: false }),
  ]);
  return { mission: { id: data.id, reference: data.reference, title: data.title, description: data.description, serviceId: data.service_id, directionId: data.direction_id, status: data.status, priority: data.priority, assigneeName: data.assignee_name, dueAt: data.due_at, createdAt: data.created_at } as MissionSummary, events: events ?? [], proofs: proofs ?? [] };
}
