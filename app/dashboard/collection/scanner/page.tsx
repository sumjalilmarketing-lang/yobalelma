import { OperationForm } from "@/components/operations/operation-form";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scanner collecte | Yobalelma",
};

export default async function CollectionScannerPage() {
  const state = await requireRole(["collection_driver"], "/dashboard/collection/scanner");

  return (
    <PageShell
      eyebrow="Collecte"
      title="Scanner collecte"
      description="Ajoute un colis a un manifeste et signale un incident si necessaire."
    >
      {state.status === "ready" ? (
        <OperationForm
          title="Scan manifeste"
          endpoint="/api/collection/manifests"
          submitLabel="Ajouter au manifeste"
          fields={[
            { name: "mode", label: "Mode", type: "hidden", defaultValue: "item" },
            { name: "manifestId", label: "ID manifeste", required: true },
            { name: "shipmentId", label: "ID expedition", required: true },
            { name: "incidentNote", label: "Incident", type: "textarea" },
          ]}
        />
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}
