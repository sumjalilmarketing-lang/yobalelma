import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Voyages hub | Yobalelma",
};

export default async function HubTripsPage() {
  const state = await requireRole(
    ["hub_agent", "hub_manager", "operations_manager", "admin", "super_admin"],
    "/dashboard/hub/trips",
  );

  return (
    <PageShell
      eyebrow="Hub"
      title="Voyageurs et capacites"
      description="Consulte les trajets et documents soumis avant creation des lots."
    >
      {state.status === "ready" ? <Trips /> : <ConfigurationNotice />}
    </PageShell>
  );
}

async function Trips() {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const { data, error } = await supabase
    .from("trips")
    .select("id, traveler_id, origin_city, origin_country, destination_city, destination_country, departure_date, available_weight_kg, status")
    .order("departure_date", { ascending: true });

  if (error) {
    return <EmptyState title="Chargement impossible" description={error.message} />;
  }

  if (!data?.length) {
    return <EmptyState title="Aucun voyage" description="Les voyages declares par les voyageurs apparaitront ici." />;
  }

  return (
    <DataGrid>
      {data.map((trip) => (
        <DataCard
          key={trip.id}
          title={`${trip.origin_city} -> ${trip.destination_city}`}
          subtitle={trip.status}
          rows={[
            { label: "Voyageur", value: trip.traveler_id },
            { label: "Depart", value: trip.departure_date },
            { label: "Capacite", value: `${trip.available_weight_kg} kg` },
          ]}
        />
      ))}
    </DataGrid>
  );
}
