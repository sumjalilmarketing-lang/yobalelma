import { HubIncidentForm } from "@/components/forms/hub-operations-forms";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Anomalies hub | Yobalelma",
};

export default async function HubAnomaliesPage() {
  const state = await requireRole(
    ["hub_agent", "operations_manager", "admin", "super_admin"],
    "/dashboard/hub/anomalies",
  );

  return (
    <PageShell
      eyebrow="Hub"
      title="Anomalies et incidents"
      description="Declare, priorise et trace les incidents qui bloquent un colis, un lot ou un payout."
      scene="hub"
    >
      {state.status === "ready" ? <HubIncidentForm /> : <ConfigurationNotice />}
    </PageShell>
  );
}
