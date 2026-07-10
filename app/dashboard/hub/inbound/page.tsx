import { OperationForm } from "@/components/operations/operation-form";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reception hub | Yobalelma",
};

export default async function HubInboundPage() {
  const state = await requireRole(
    ["hub_agent", "operations_manager", "admin", "super_admin"],
    "/dashboard/hub/inbound",
  );

  return (
    <PageShell
      eyebrow="Hub"
      title="Reception et inspection"
      description="Controle les colis entrants, le poids, l'etat et l'emplacement hub."
    >
      {state.status === "ready" ? (
        <OperationForm
          title="Inspection colis"
          endpoint="/api/hub/inspections"
          submitLabel="Enregistrer l'inspection"
          fields={[
            { name: "shipmentId", label: "ID expedition", required: true },
            { name: "decision", label: "Decision", type: "select", options: [
              { label: "Accepte", value: "accepted" },
              { label: "Endommage", value: "damaged" },
              { label: "Manquant", value: "missing" },
              { label: "Refuse", value: "rejected" },
            ], required: true },
            { name: "measuredWeightKg", label: "Poids mesure", type: "number" },
            { name: "storageLocation", label: "Emplacement" },
            { name: "photoPath", label: "Photo inspection Storage" },
            { name: "note", label: "Note", type: "textarea" },
          ]}
        />
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}
