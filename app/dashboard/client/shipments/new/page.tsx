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
      description="Renseigne le départ, la destination et les informations utiles pour préparer ton envoi."
    >
      {state.status === "ready" ? <ShipmentForm /> : <ConfigurationNotice />}
    </PageShell>
  );
}
