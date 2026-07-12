import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inventaire relais | Yobalelma",
};

export default async function RelayInventoryPage() {
  const state = await requireRole(["relay_agent", "relay_manager"], "/dashboard/relay/inventory");

  return (
    <PageShell
      eyebrow="Relais"
      title="Inventaire relais"
      description="Liste des colis stockes, liberes ou en exception dans les points relais accessibles."
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
    .from("relay_inventory")
    .select("id, status, checked_in_at, checked_out_at, shipments(tracking_code, origin_city, destination_city, status), relay_points(name, city, country)")
    .order("updated_at", { ascending: false });

  if (error) {
    return <EmptyState title="Chargement impossible" description={error.message} />;
  }

  if (!data?.length) {
    return <EmptyState title="Inventaire vide" description="Les colis receptionnes par scan entree apparaitront ici." />;
  }

  return (
    <DataGrid>
      {data.map((item) => {
        const shipment = Array.isArray(item.shipments) ? item.shipments[0] : item.shipments;
        const relay = Array.isArray(item.relay_points) ? item.relay_points[0] : item.relay_points;

        return (
          <DataCard
            key={item.id}
            title={shipment?.tracking_code ?? item.id}
            subtitle={item.status}
            rows={[
              { label: "Relais", value: relay ? `${relay.name}, ${relay.city}` : "Non charge" },
              { label: "Expedition", value: shipment ? `${shipment.origin_city} -> ${shipment.destination_city}` : "Non charge" },
              { label: "Entree", value: new Date(item.checked_in_at).toLocaleString("fr-FR") },
            ]}
          />
        );
      })}
    </DataGrid>
  );
}
