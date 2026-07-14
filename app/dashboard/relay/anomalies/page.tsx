import { OperationForm } from "@/components/operations/operation-form";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Anomalies relais | Yobalelma",
};

export default async function RelayAnomaliesPage() {
  const state = await requireRole(
    ["relay_agent", "relay_manager", "operations_manager", "admin", "super_admin"],
    "/dashboard/relay/anomalies",
  );

  return (
    <PageShell
      eyebrow="Relais"
      title="Anomalies relais"
      description="Journalise un colis endommage, absent, refuse ou incoherent via un scan exception audite."
      scene="relay"
    >
      {state.status === "ready" ? (
        <OperationForm
          title="Scan exception relais"
          endpoint="/api/relay/scans"
          submitLabel="Enregistrer l'anomalie"
          fields={[
            { name: "trackingCode", label: "Code tracking", required: true },
            { name: "relayPointId", label: "ID point relais", required: true },
            { name: "scanType", label: "Type", type: "hidden", defaultValue: "exception" },
            { name: "note", label: "Note anomalie", type: "textarea", required: true },
          ]}
        />
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}
