import { redirect } from "next/navigation";
import {
  getRoleDashboardPath,
  isPlatformRole,
  type PlatformRole,
} from "@/lib/auth/roles";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export type AuthState =
  | { status: "needs-env" }
  | { status: "signed-out" }
  | { status: "ready"; userId: string; email: string; role: PlatformRole };

export async function getAuthState(): Promise<AuthState> {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return { status: "needs-env" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "signed-out" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_role, role, email")
    .eq("id", user.id)
    .maybeSingle();

  const rawRole =
    profile && "primary_role" in profile && typeof profile.primary_role === "string"
      ? profile.primary_role
      : profile && "role" in profile && typeof profile.role === "string"
        ? normalizeLegacyRole(profile.role)
        : "client";

  const role = isPlatformRole(rawRole) ? rawRole : "client";

  return {
    status: "ready",
    userId: user.id,
    email: user.email ?? profile?.email ?? "Compte Yobalelma",
    role,
  };
}

export async function requireUser(returnTo = "/dashboard") {
  const state = await getAuthState();

  if (state.status === "signed-out") {
    redirect(`/auth/sign-in?next=${encodeURIComponent(returnTo)}`);
  }

  return state;
}

export async function requireRole(allowedRoles: PlatformRole[], returnTo: string) {
  const state = await requireUser(returnTo);

  if (state.status !== "ready") {
    return state;
  }

  if (!allowedRoles.includes(state.role)) {
    redirect(getRoleDashboardPath(state.role));
  }

  return state;
}

function normalizeLegacyRole(role: string): PlatformRole {
  if (role === "traveler") {
    return "traveler";
  }

  if (role === "admin") {
    return "admin";
  }

  return "client";
}

