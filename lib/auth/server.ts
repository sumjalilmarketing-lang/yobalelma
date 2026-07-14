import { redirect } from "next/navigation";
import {
  getRoleDashboardPath,
  mergePlatformRoles,
  normalizePlatformRole,
  selectRoleForAccess,
  type PlatformRole,
} from "@/lib/auth/roles";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export type AccountStatus =
  | "pending_email_confirmation"
  | "active"
  | "suspended"
  | "closed";

export type IdentityVerificationStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected"
  | "needs_more_information"
  | "expired";

type ReadyAuthState = {
  accountStatus: AccountStatus;
  email: string;
  identityStatus: IdentityVerificationStatus;
  role: PlatformRole;
  roles: PlatformRole[];
  status: "ready";
  userId: string;
};

export type AuthState =
  | { status: "needs-env" }
  | { status: "signed-out" }
  | ReadyAuthState
  | (Omit<ReadyAuthState, "status"> & {
      reason: "suspended" | "closed";
      status: "blocked";
    });

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

  const [profileResult, roleAssignmentsResult, userRolesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("primary_role, role, email, account_status, identity_status")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("role_assignments")
      .select("role")
      .eq("profile_id", user.id)
      .eq("status", "active"),
    supabase
      .from("user_roles")
      .select("role_id")
      .eq("profile_id", user.id),
  ]);

  const profile = profileResult.data;
  const profileRoles = [profile?.primary_role, profile?.role];
  const assignmentRoles = roleAssignmentsResult.data?.map((assignment) => assignment.role) ?? [];
  const userRoles = userRolesResult.data?.map((assignment) => assignment.role_id) ?? [];
  const roles = mergePlatformRoles(profileRoles, assignmentRoles, userRoles);
  const primaryRole = normalizePlatformRole(profile?.primary_role) ?? roles[0] ?? "client";
  const resolvedRoles = roles.length > 0 ? roles : [primaryRole];
  const accountStatus = normalizeAccountStatus(profile?.account_status);
  const identityStatus = normalizeIdentityStatus(profile?.identity_status);
  const baseState = {
    accountStatus,
    email: user.email ?? profile?.email ?? "Compte Yobalelma",
    identityStatus,
    role: primaryRole,
    roles: resolvedRoles,
    userId: user.id,
  };

  if (accountStatus === "suspended" || accountStatus === "closed") {
    return {
      ...baseState,
      reason: accountStatus,
      status: "blocked",
    };
  }

  return {
    ...baseState,
    status: "ready",
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

  const selectedRole = selectRoleForAccess(state.roles, allowedRoles);

  if (!selectedRole) {
    redirect(getRoleDashboardPath(state.role));
  }

  return selectedRole === state.role ? state : { ...state, role: selectedRole };
}

function normalizeAccountStatus(status: unknown): AccountStatus {
  if (
    status === "pending_email_confirmation" ||
    status === "active" ||
    status === "suspended" ||
    status === "closed"
  ) {
    return status;
  }

  return "active";
}

function normalizeIdentityStatus(status: unknown): IdentityVerificationStatus {
  if (
    status === "pending" ||
    status === "submitted" ||
    status === "approved" ||
    status === "rejected" ||
    status === "needs_more_information" ||
    status === "expired"
  ) {
    return status;
  }

  return "pending";
}
