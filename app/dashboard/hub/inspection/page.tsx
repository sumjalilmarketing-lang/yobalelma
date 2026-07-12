import { HubAdvancedInspectionForm } from "@/components/forms/hub-operations-forms";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inspection hub | Yobalelma",
};

export default async function HubInspectionPage() {
  const state = await requireRole(
    ["hub_agent", "operations_manager", "admin", "super_admin"],
    "/dashboard/hub/inspection",
  );

  return (
    <PageShell
      eyebrow="Hub"
      title="Inspection colis"
      description="Controle le poids, l'etat, les preuves et la decision avant stockage ou lot."
      scene="hub"
    >
      {state.status === "ready" ? <HubAdvancedInspectionForm /> : <ConfigurationNotice />}
    </PageShell>
  );
}
