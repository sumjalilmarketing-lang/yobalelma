import { ShipmentForm } from "@/components/forms/shipment-form";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nouvelle expedition | Yobalelma",
};

export default async function NewShipmentPage() {
  const state = await requireRole(["client"], "/dashboard/client/shipments/new");

  return (
    <PageShell
      eyebrow="Client"
      title="Creer une expedition"
      description="Le serveur detecte automatiquement national ou international selon les pays saisis."
    >
      {state.status === "ready" ? <ShipmentForm /> : <ConfigurationNotice />}
    </PageShell>
  );
}
