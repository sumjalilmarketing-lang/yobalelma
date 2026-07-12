import type { ReactNode } from "react";
import {
  roleHasAnyPermission,
  type PlatformPermission,
  type PlatformRole,
} from "@/lib/auth/roles";

type GuardProps = {
  role: PlatformRole;
  children: ReactNode;
  fallback?: ReactNode;
};

export function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
  role,
}: GuardProps & {
  allowedRoles: PlatformRole[];
}) {
  return allowedRoles.includes(role) ? children : fallback;
}

export function PermissionGuard({
  anyOf,
  children,
  fallback = null,
  role,
}: GuardProps & {
  anyOf: PlatformPermission[];
}) {
  return roleHasAnyPermission(role, anyOf) ? children : fallback;
}

