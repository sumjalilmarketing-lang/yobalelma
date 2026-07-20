import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { getGovernanceRole } from "./governance-catalog";
import type { AdminSession, GovernanceAssignment } from "./types";

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return null;
  const [{ data: userData }, { data: sessionData }] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);
  const user = userData.user;
  if (!user || !sessionData.session) return null;
  const client = supabase as SupabaseClient;
  const [profileResult, rolesResult, assignmentsResult] = await Promise.all([
    client.from("profiles").select("email, full_name, primary_role, role").eq("id", user.id).maybeSingle(),
    client.from("user_roles").select("role_id").eq("profile_id", user.id),
    client.from("governance_staff_assignments").select("id, role_id, direction_id, service_id, country_code, region_code, organization_id, hub_id, relay_point_id, team_id, operational_zone_id").eq("profile_id", user.id).eq("active", true),
  ]);
  const profile = profileResult.data;
  const rawRoles = [profile?.primary_role, profile?.role, ...(rolesResult.data?.map((item) => item.role_id) ?? [])].filter((item): item is string => typeof item === "string");
  const roleIds = [...new Set(rawRoles.filter((id) => getGovernanceRole(id)))];
  if (!roleIds.length) return null;
  const assignments: GovernanceAssignment[] = (assignmentsResult.data ?? []).map((item) => ({
    id: item.id, roleId: item.role_id, directionId: item.direction_id, serviceId: item.service_id,
    countryCode: item.country_code ?? undefined, regionCode: item.region_code ?? undefined,
    organizationId: item.organization_id ?? undefined, hubId: item.hub_id ?? undefined,
    relayPointId: item.relay_point_id ?? undefined, teamId: item.team_id ?? undefined,
    operationalZoneId: item.operational_zone_id ?? undefined,
  }));
  for (const roleId of roleIds) {
    if (assignments.some((item) => item.roleId === roleId)) continue;
    const role = getGovernanceRole(roleId);
    if (role) assignments.push({ roleId, directionId: role.directionId, serviceId: role.serviceId });
  }
  return {
    userId: user.id,
    email: profile?.email || user.email || "",
    name: profile?.full_name || user.user_metadata?.full_name || user.email || "Collaborateur Yobalelma",
    roleIds,
    assignments,
  };
}

export async function requireAdminSession(returnTo = "/command") {
  const session = await getAdminSession();
  if (!session) redirect(`/auth/sign-in?next=${encodeURIComponent(returnTo)}`);
  return session;
}

export function canAccessDirection(session: AdminSession, directionId: string) {
  if (session.roleIds.some((id) => id === "admin" || id === "super_admin")) return true;
  return session.assignments.some((item) => item.directionId === directionId);
}

export function canAccessService(session: AdminSession, serviceId: string) {
  if (session.roleIds.some((id) => id === "admin" || id === "super_admin" || id === "operations_manager")) return true;
  return session.assignments.some((item) => item.serviceId === serviceId);
}
