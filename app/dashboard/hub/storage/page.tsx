import { HubStorageMoveForm } from "@/components/forms/hub-operations-forms";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stockage hub | Yobalelma",
};

export default async function HubStoragePage() {
  const state = await requireRole(
    ["hub_agent", "operations_manager", "admin", "super_admin"],
    "/dashboard/hub/storage",
  );

  return (
    <PageShell
      eyebrow="Hub"
      title="Stockage et mouvements"
      description="Affecte un emplacement, deplace un colis et garde l'historique physique du hub."
      scene="hub"
    >
      {state.status === "ready" ? <HubStorageMoveForm /> : <ConfigurationNotice />}
    </PageShell>
  );
}
