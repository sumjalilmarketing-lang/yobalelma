import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { createHubSessionToken, hubSessionCookie, verifyHubSessionToken } from "./session-token";
import { assertHubRouteAccess } from "./permissions";
import { fromSupabaseTable } from "./supabase-loose";
import { isHubRole, type HubRole, type HubSession } from "./types";

export const demoHubAccounts: Array<{
  code: string;
  email: string;
  hubId: string;
  name: string;
  role: HubRole;
}> = [
  {
    code: "HUB-AGENT",
    email: "agent.hub@yobalelma.test",
    hubId: "hub-dss",
    name: "Awa Diop",
    role: "hub_agent",
  },
  {
    code: "HUB-SUPERVISOR",
    email: "supervisor.hub@yobalelma.test",
    hubId: "hub-dss",
    name: "Mamadou Sarr",
    role: "hub_supervisor",
  },
  {
    code: "HUB-MANAGER",
    email: "manager.hub@yobalelma.test",
    hubId: "hub-dss",
    name: "Ndeye Fall",
    role: "hub_manager",
  },
  {
    code: "OPS-READ",
    email: "operations@yobalelma.test",
    hubId: "hub-dss",
    name: "Operations Control",
    role: "operations_manager",
  },
];

export function findDemoHubAccount(email: string, code: string, role: string) {
  return demoHubAccounts.find(
    (account) =>
      account.email.toLowerCase() === email.trim().toLowerCase() &&
      account.code === code.trim() &&
      account.role === role,
  );
}

export async function createDemoHubSession(email: string, code: string, role: string) {
  const account = findDemoHubAccount(email, code, role);

  if (!account) {
    throw new Error("Identifiants Hub invalides.");
  }

  const session: HubSession = {
    email: account.email,
    expiresAt: Date.now() + 1000 * 60 * 60 * 8,
    hubId: account.hubId,
    name: account.name,
    role: account.role,
    sessionId: randomUUID(),
    source: "demo",
  };

  return {
    session,
    token: await createHubSessionToken(session),
  };
}

export async function getHubSession() {
  const cookieStore = await cookies();
  const supabaseSession = await getSupabaseHubSession();

  if (supabaseSession) {
    return supabaseSession;
  }

  return verifyHubSessionToken(cookieStore.get(hubSessionCookie)?.value);
}

export async function requireHubSession(pathname = "/hub", method = "GET") {
  const session = await getHubSession();

  if (!session) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(pathname)}`);
  }

  assertHubRouteAccess(session.role, pathname, method);

  return session;
}

async function getSupabaseHubSession(): Promise<HubSession | null> {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [{ data: userData }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);
  const user = userData.user;

  if (!user) {
    return null;
  }

  type HubAgentProfileRow = {
    hub_id: string | null;
  };
  type OperationsProfileRow = {
    managed_hub_ids: string[] | null;
  };
  type AirportHubRow = {
    id: string;
  };

  const [profileResult, userRolesResult, hubProfileResult, operationsProfileResult, fallbackHubResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("email, full_name, primary_role, role")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.from("user_roles").select("role_id").eq("profile_id", user.id),
      fromSupabaseTable(supabase, "hub_agent_profiles")
        .select<HubAgentProfileRow>("hub_id")
        .eq("profile_id", user.id)
        .eq("is_active", true)
        .maybeSingle(),
      fromSupabaseTable(supabase, "operations_profiles")
        .select<OperationsProfileRow>("managed_hub_ids")
        .eq("profile_id", user.id)
        .eq("is_active", true)
        .maybeSingle(),
      fromSupabaseTable(supabase, "airport_hubs").select<AirportHubRow>("id").limit(1).maybeSingle(),
    ]);

  const profile = profileResult.data;
  const role = [
    profile?.primary_role,
    profile?.role,
    ...(userRolesResult.data?.map((assignment) => assignment.role_id) ?? []),
  ].find(isHubRole);

  if (!role) {
    return null;
  }

  const hubId = hubProfileResult.data?.hub_id ?? operationsProfileResult.data?.managed_hub_ids?.[0] ?? fallbackHubResult.data?.id;

  if (!hubId) {
    return null;
  }

  const metadataName = user.user_metadata?.name;

  return {
    email: profile?.email || user.email || "",
    expiresAt: sessionData.session?.expires_at ? sessionData.session.expires_at * 1000 : Date.now() + 60 * 60 * 1000,
    hubId,
    name: profile?.full_name || (typeof metadataName === "string" ? metadataName : null) || user.email || "Hub operator",
    role,
    sessionId: sessionData.session?.access_token.slice(0, 16) ?? user.id,
    source: "supabase",
    userId: user.id,
  };
}
