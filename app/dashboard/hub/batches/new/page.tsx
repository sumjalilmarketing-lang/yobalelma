import { HubForms } from "@/components/forms/hub-forms";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function NewHubBatchPage() {
  const state = await requireRole(
    ["hub_agent", "operations_manager", "admin", "super_admin"],
    "/dashboard/hub/batches/new",
  );

  return (
    <PageShell
      eyebrow="Hub"
      title="Nouveau lot hub"
      description="Cree un lot, reserve la capacite et prepare le handover voyageur."
      scene="hub"
    >
      {state.status === "ready" ? <HubForms /> : <ConfigurationNotice />}
    </PageShell>
  );
}

