import { RoleDashboard } from "@/components/dashboard/role-dashboard";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import type { PlatformRole } from "@/lib/auth/roles";
import type { JourneyScene } from "@/components/visual/yobalelma-world";

type Action = { href: string; label: string; variant?: "default" | "secondary" | "outline" | "ghost" | "dark" };

export async function ExternalRoleHome({
  role,
  returnTo,
  title,
  roleLabel,
  description,
  scene,
  actions,
  checkpoints,
}: {
  role: PlatformRole;
  returnTo: string;
  title: string;
  roleLabel: string;
  description: string;
  scene: JourneyScene;
  actions: Action[];
  checkpoints: string[];
}) {
  const state = await requireRole([role], returnTo);

  return (
    <PageShell eyebrow={roleLabel} title={title} description={description} scene={scene}>
      {state.status === "ready" ? (
        <RoleDashboard
          email={state.email}
          roleLabel={roleLabel}
          title={title}
          description={description}
          scene={scene}
          actions={actions}
          checkpoints={checkpoints}
        />
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}
