import {
  HubAdvancedInspectionForm,
  HubInboundReceiptForm,
} from "@/components/forms/hub-operations-forms";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reception hub | Yobalelma",
};

export default async function HubInboundPage() {
  const state = await requireRole(
    ["hub_agent", "hub_manager", "operations_manager", "admin", "super_admin"],
    "/dashboard/hub/inbound",
  );

  return (
    <PageShell
      eyebrow="Hub"
      title="Reception et inspection"
      description="Controle les colis entrants, le poids, l'etat et l'emplacement hub."
    >
      {state.status === "ready" ? (
        <div className="grid gap-8 xl:grid-cols-2">
          <HubInboundReceiptForm />
          <HubAdvancedInspectionForm />
        </div>
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}
