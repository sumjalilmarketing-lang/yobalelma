import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { assertRelayAccess } from "./permissions";
import { relaySessionCookie, createRelaySessionToken, verifyRelaySessionToken } from "./session-token";
import { isRelayRole, type RelayRole, type RelaySession } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const demoRelayAccounts: Array<{ email: string; code: string; name: string; role: RelayRole }> = [
  { email: "agent.relay@yobalelma.test", code: "RLY-AGENT", name: "Aminata Cissé", role: "relay_agent" },
  { email: "manager.relay@yobalelma.test", code: "RLY-MANAGER", name: "Mamadou Diop", role: "relay_manager" },
  { email: "operations@yobalelma.test", code: "OPS-RELAY", name: "Operations Control", role: "operations_manager" },
];

export async function createDemoRelaySession(email: string, code: string, role: string) {
  const account = demoRelayAccounts.find((candidate) => candidate.email === email.trim().toLowerCase() && candidate.code === code.trim() && candidate.role === role);
  if (!account) throw new Error("Identifiants Relay invalides.");
  const session: RelaySession = { email: account.email, expiresAt: Date.now() + 28_800_000, name: account.name, role: account.role, sessionId: randomUUID(), source: "demo", relayPointId: "relay-orange-plateau" };
  return { session, token: await createRelaySessionToken(session) };
}

export async function getRelaySession() {
  const supabaseSession = await getSupabaseRelaySession();
  if (supabaseSession) return supabaseSession;
  return verifyRelaySessionToken((await cookies()).get(relaySessionCookie)?.value);
}
export async function requireRelaySession(pathname = "/relay", method = "GET") {
  const session = await getRelaySession();
  if (!session) redirect(`/auth/sign-in?next=${encodeURIComponent(pathname)}`);
  assertRelayAccess(session.role, pathname, method); return session;
}

async function getSupabaseRelaySession(): Promise<RelaySession | null> {
  const supabase = await tryCreateSupabaseServerClient(); if (!supabase) return null;
  const [{ data: userData }, { data: sessionData }] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);
  const user = userData.user; if (!user) return null;
  const [profileResult, roleResult] = await Promise.all([
    supabase.from("profiles").select("email, full_name, primary_role, role").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role_id").eq("profile_id", user.id),
  ]);
  const profile = profileResult.data;
  const role = [profile?.primary_role, profile?.role, ...(roleResult.data?.map((row) => row.role_id) ?? [])].find(isRelayRole);
  if (!role) return null;
  const relayClient = supabase as SupabaseClient;
  const { data: membership } = await relayClient
    .from("relay_point_members")
    .select("relay_point_id")
    .eq("profile_id", user.id)
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  return { email: profile?.email || user.email || "", expiresAt: sessionData.session?.expires_at ? sessionData.session.expires_at * 1000 : Date.now() + 3_600_000, name: profile?.full_name || user.user_metadata?.name || user.email || "Agent relais", role, sessionId: sessionData.session?.access_token.slice(0, 16) ?? user.id, source: "supabase", userId: user.id, relayPointId: typeof membership?.relay_point_id === "string" ? membership.relay_point_id : undefined };
}
