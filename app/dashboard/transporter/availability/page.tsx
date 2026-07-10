import { TransporterOperationsForm } from "@/components/forms/transporter-operations-form";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Disponibilite livreur | Yobalelma",
};

export default async function TransporterAvailabilityPage() {
  const state = await requireRole(["local_transporter"], "/dashboard/transporter/availability");

  return (
    <PageShell
      eyebrow="Livreur"
      title="Disponibilite"
      description="Declare tes creneaux disponibles pour le dispatch automatique."
    >
      {state.status === "ready" ? <TransporterOperationsForm /> : <ConfigurationNotice />}
    </PageShell>
  );
}
