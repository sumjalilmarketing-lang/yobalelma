import { InternationalWorkflowView } from "@/components/international/international-workflow-view";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import type { PlatformRole } from "@/lib/auth/roles";
import { loadInternationalWorkflowData } from "@/lib/international/workflow-data";
import type { JourneyScene } from "@/components/visual/yobalelma-world";

export async function InternationalDashboardPage({
  allowedRoles,
  description,
  eyebrow,
  returnTo,
  scene,
  title,
}: {
  allowedRoles: PlatformRole[];
  description: string;
  eyebrow: string;
  returnTo: string;
  scene?: JourneyScene;
  title: string;
}) {
  const state = await requireRole(allowedRoles, returnTo);

  return (
    <PageShell eyebrow={eyebrow} title={title} description={description} scene={scene}>
      {state.status === "ready" ? (
        <InternationalWorkflowView
          data={await loadInternationalWorkflowData({
            role: state.role,
            userId: state.userId,
          })}
        />
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}
