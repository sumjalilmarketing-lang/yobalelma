import { OperationForm } from "@/components/operations/operation-form";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sortie relais | Yobalelma",
};

export default async function RelayOutboundPage() {
  const state = await requireRole(["relay_agent"], "/dashboard/relay/outbound");

  return (
    <PageShell
      eyebrow="Relais"
      title="Remise collecte"
      description="Scanne un colis en sortie relais pour le remettre a la collecte Yobalelma."
    >
      {state.status === "ready" ? (
        <OperationForm
          title="Scan sortie relais"
          endpoint="/api/relay/scans"
          submitLabel="Enregistrer la sortie"
          fields={[
            { name: "trackingCode", label: "Code tracking", required: true },
            { name: "relayPointId", label: "ID point relais", required: true },
            { name: "scanType", label: "Type", type: "hidden", defaultValue: "check_out" },
            { name: "note", label: "Note", type: "textarea" },
          ]}
        />
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}
