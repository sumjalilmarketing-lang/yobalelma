import { TransporterOperationsForm } from "@/components/forms/transporter-operations-form";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vehicule livreur | Yobalelma",
};

export default async function TransporterVehiclePage() {
  const state = await requireRole(["local_transporter"], "/dashboard/transporter/vehicle");

  return (
    <PageShell
      eyebrow="Livreur"
      title="Vehicule et capacite"
      description="Enregistre le vehicule utilise pour filtrer les missions selon le poids."
    >
      {state.status === "ready" ? <TransporterOperationsForm /> : <ConfigurationNotice />}
    </PageShell>
  );
}
