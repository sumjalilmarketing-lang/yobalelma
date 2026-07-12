import { OperationForm } from "@/components/operations/operation-form";
import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detail batch | Yobalelma",
};

export default async function HubBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await requireRole(
    ["hub_agent", "hub_manager", "operations_manager", "admin", "super_admin"],
    `/dashboard/hub/batches/${id}`,
  );

  return (
    <PageShell
      eyebrow="Hub"
      title="Detail batch"
      description="Inspecte les colis, reserve la capacite et prepare les QR de handover."
    >
      {state.status === "ready" ? (
        <BatchDetail batchId={id} />
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}

async function BatchDetail({ batchId }: { batchId: string }) {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const [batchResult, reservationsResult] = await Promise.all([
    supabase.from("hub_batches").select("*").eq("id", batchId).maybeSingle(),
    supabase
      .from("capacity_reservations")
      .select("id, shipment_id, reserved_weight_kg, status, shipments(tracking_code, status)")
      .eq("batch_id", batchId)
      .order("created_at", { ascending: false }),
  ]);

  if (batchResult.error) {
    return <EmptyState title="Batch introuvable" description={batchResult.error.message} />;
  }

  if (!batchResult.data) {
    return <EmptyState title="Batch introuvable" description="Aucun batch ne correspond a cet identifiant." />;
  }

  return (
    <div className="grid gap-8">
      <DataGrid>
        <DataCard
          title={batchResult.data.code}
          subtitle={batchResult.data.status}
          rows={[
            { label: "Route", value: `${batchResult.data.origin_hub} -> ${batchResult.data.destination_hub}` },
            { label: "Capacite", value: `${batchResult.data.reserved_weight_kg}/${batchResult.data.capacity_kg} kg` },
            { label: "Voyageur", value: batchResult.data.traveler_id ?? "Non lie" },
          ]}
        />
      </DataGrid>
      <OperationForm
        title="Inspection colis"
        endpoint={`/api/hub/batches/${batchId}`}
        method="PATCH"
        submitLabel="Enregistrer"
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
          { name: "photoPath", label: "Photo Storage" },
          { name: "note", label: "Note", type: "textarea" },
        ]}
      />
      <section className="grid gap-4">
        <h2 className="text-xl font-black">Colis reserves</h2>
        <DataGrid>
          {(reservationsResult.data ?? []).map((reservation) => {
            const shipment = Array.isArray(reservation.shipments) ? reservation.shipments[0] : reservation.shipments;

            return (
              <DataCard
                key={reservation.id}
                title={shipment?.tracking_code ?? reservation.shipment_id}
                subtitle={reservation.status}
                rows={[
                  { label: "Poids", value: `${reservation.reserved_weight_kg} kg` },
                  { label: "Statut colis", value: shipment?.status ?? "Non charge" },
                ]}
              />
            );
          })}
        </DataGrid>
      </section>
    </div>
  );
}
