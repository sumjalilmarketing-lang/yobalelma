import { RoleDashboard } from "@/components/dashboard/role-dashboard";
import { PageShell } from "@/components/layout/page-shell";
import {
  AccountAccessNotice,
  ConfigurationNotice,
} from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import {
  getUserAppSpaces,
  type PlatformRole,
} from "@/lib/auth/roles";
import type { JourneyScene } from "@/components/visual/yobalelma-world";
import { SponsoredPlacement } from "@/components/monetization/sponsored-placement";

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
  const spaces =
    state.status === "ready" || state.status === "blocked"
      ? getUserAppSpaces(state.roles).map((space) => ({
          ...space,
          current: space.role === role,
        }))
      : [];

  return (
    <PageShell eyebrow={roleLabel} title={title} description={description} scene={scene}>
      {state.status === "ready" ? (
        <div className="grid gap-5">
          <AccountAccessNotice
            accountStatus={state.accountStatus}
            identityStatus={state.identityStatus}
          />
          <RoleDashboard
            email={state.email}
            roleLabel={roleLabel}
            title={title}
            description={description}
            scene={scene}
            actions={actions}
            checkpoints={checkpoints}
            spaces={spaces}
          />
          {role === "client" ? <SponsoredPlacement code="user.home.partner" /> : null}
        </div>
      ) : state.status === "blocked" ? (
        <AccountAccessNotice
          accountStatus={state.accountStatus}
          identityStatus={state.identityStatus}
        />
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}
