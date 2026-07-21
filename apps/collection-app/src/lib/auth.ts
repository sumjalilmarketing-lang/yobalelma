import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { assertCollectionAccess } from "./permissions";
import { collectionSessionCookie, createCollectionSessionToken, verifyCollectionSessionToken } from "./session-token";
import { isCollectionRole, type CollectionRole, type CollectionSession } from "./types";

export const demoCollectionAccounts: Array<{ email: string; code: string; name: string; role: CollectionRole }> = [
  { email: "driver.collection@yobalelma.test", code: "COL-DRIVER", name: "Ibrahima Diagne", role: "collection_driver" },
  { email: "manager.collection@yobalelma.test", code: "COL-MANAGER", name: "Fatou Ndiaye", role: "collection_manager" },
  { email: "operations@yobalelma.test", code: "OPS-COLLECTION", name: "Operations Control", role: "operations_manager" },
];

export async function createDemoCollectionSession(email: string, code: string, role: string) {
  const account = demoCollectionAccounts.find((candidate) => candidate.email === email.trim().toLowerCase() && candidate.code === code.trim() && candidate.role === role);
  if (!account) throw new Error("Identifiants Collection invalides.");
  const session: CollectionSession = { email: account.email, expiresAt: Date.now() + 28_800_000, name: account.name, role: account.role, sessionId: randomUUID(), source: "demo", vehicleId: "veh-001" };
  return { session, token: await createCollectionSessionToken(session) };
}

export async function getCollectionSession() {
  const supabaseSession = await getSupabaseCollectionSession();
  if (supabaseSession) return supabaseSession;
  return verifyCollectionSessionToken((await cookies()).get(collectionSessionCookie)?.value);
}
export async function requireCollectionSession(pathname = "/collection", method = "GET") {
  const session = await getCollectionSession();
  if (!session) redirect(`/auth/sign-in?next=${encodeURIComponent(pathname)}`);
  assertCollectionAccess(session.role, pathname, method); return session;
}

async function getSupabaseCollectionSession(): Promise<CollectionSession | null> {
  const supabase = await tryCreateSupabaseServerClient(); if (!supabase) return null;
  const [{ data: userData }, { data: sessionData }] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);
  const user = userData.user; if (!user) return null;
  const [profileResult, roleResult] = await Promise.all([
    supabase.from("profiles").select("email, full_name, primary_role, role").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role_id").eq("profile_id", user.id),
  ]);
  const profile = profileResult.data;
  const role = [...(roleResult.data?.map((row) => row.role_id) ?? []), profile?.primary_role, profile?.role].find(isCollectionRole);
  if (!role) return null;
  return { email: profile?.email || user.email || "", expiresAt: sessionData.session?.expires_at ? sessionData.session.expires_at * 1000 : Date.now() + 3_600_000, name: profile?.full_name || user.user_metadata?.name || user.email || "Transporteur", role, sessionId: sessionData.session?.access_token.slice(0, 16) ?? user.id, source: "supabase", userId: user.id };
}
