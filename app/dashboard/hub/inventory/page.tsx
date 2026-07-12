import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inventaire hub | Yobalelma",
};

export default async function HubInventoryPage() {
  const state = await requireRole(
    ["hub_agent", "hub_manager", "operations_manager", "admin", "super_admin"],
    "/dashboard/hub/inventory",
  );

  return (
    <PageShell
      eyebrow="Hub"
      title="Inventaire hub"
      description="Colis inspectes, stockes ou reserves dans les lots internationaux."
    >
      {state.status === "ready" ? <Inventory /> : <ConfigurationNotice />}
    </PageShell>
  );
}

async function Inventory() {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const { data, error } = await supabase
    .from("capacity_reservations")
    .select("id, reserved_weight_kg, status, batch_id, shipment_id, shipments(tracking_code, status, origin_city, destination_city), hub_batches(code, status, reserved_weight_kg, capacity_kg)")
    .order("created_at", { ascending: false });

  if (error) {
    return <EmptyState title="Chargement impossible" description={error.message} />;
  }

  if (!data?.length) {
    return <EmptyState title="Aucune reservation" description="Les colis reserves dans les lots apparaitront ici." />;
  }

  return (
    <DataGrid>
      {data.map((reservation) => {
        const shipment = Array.isArray(reservation.shipments) ? reservation.shipments[0] : reservation.shipments;
        const batch = Array.isArray(reservation.hub_batches) ? reservation.hub_batches[0] : reservation.hub_batches;

        return (
          <DataCard
            key={reservation.id}
            title={shipment?.tracking_code ?? reservation.shipment_id}
            subtitle={reservation.status}
            rows={[
              { label: "Batch", value: batch?.code ?? reservation.batch_id },
              { label: "Poids", value: `${reservation.reserved_weight_kg} kg` },
              { label: "Trajet", value: shipment ? `${shipment.origin_city} -> ${shipment.destination_city}` : "Non charge" },
            ]}
          />
        );
      })}
    </DataGrid>
  );
}
