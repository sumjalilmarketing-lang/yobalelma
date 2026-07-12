import { HubForms } from "@/components/forms/hub-forms";
import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Batches hub | Yobalelma",
};

export default async function HubBatchesPage() {
  const state = await requireRole(
    ["hub_agent", "hub_manager", "operations_manager", "admin", "super_admin"],
    "/dashboard/hub/batches",
  );

  return (
    <PageShell
      eyebrow="Hub"
      title="Batches"
      description="Cree les lots, assigne des colis et reserve la capacite sans depassement."
    >
      {state.status === "ready" ? (
        <div className="grid gap-8">
          <HubForms />
          <Batches />
        </div>
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}

async function Batches() {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const { data, error } = await supabase
    .from("hub_batches")
    .select("id, code, origin_hub, destination_hub, flight_number, departure_date, capacity_kg, reserved_weight_kg, status, trip_id, traveler_id")
    .order("departure_date", { ascending: true });

  if (error) {
    return <EmptyState title="Chargement impossible" description={error.message} />;
  }

  if (!data?.length) {
    return <EmptyState title="Aucun batch" description="Cree un lot pour reserver la capacite voyageur." />;
  }

  return (
    <DataGrid>
      {data.map((batch) => (
        <DataCard
          key={batch.id}
          title={batch.code}
          subtitle={batch.status}
          href={`/dashboard/hub/batches/${batch.id}`}
          rows={[
            { label: "Route", value: `${batch.origin_hub} -> ${batch.destination_hub}` },
            { label: "Capacite", value: `${batch.reserved_weight_kg}/${batch.capacity_kg} kg` },
            { label: "Voyageur", value: batch.traveler_id ?? "Non lie" },
          ]}
        />
      ))}
    </DataGrid>
  );
}
