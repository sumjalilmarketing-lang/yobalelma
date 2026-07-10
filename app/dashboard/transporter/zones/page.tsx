import { TransporterOperationsForm } from "@/components/forms/transporter-operations-form";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Zones livreur | Yobalelma",
};

export default async function TransporterZonesPage() {
  const state = await requireRole(["local_transporter"], "/dashboard/transporter/zones");

  return (
    <PageShell
      eyebrow="Livreur"
      title="Zones de livraison"
      description="Declare les villes couvertes pour recevoir les missions compatibles."
    >
      {state.status === "ready" ? <TransporterOperationsForm /> : <ConfigurationNotice />}
    </PageShell>
  );
}
