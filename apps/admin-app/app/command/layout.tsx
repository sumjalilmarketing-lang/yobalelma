import { CommandShell } from "@admin-app/src/components/command-shell";
import { requireAdminSession } from "@admin-app/src/lib/auth";
import { visibleDirectionsForRoles } from "@admin-app/src/lib/governance-catalog";

export default async function CommandLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession("/command");
  const directions = visibleDirectionsForRoles(session.roleIds);
  return <CommandShell session={session} directions={directions}>{children}</CommandShell>;
}
