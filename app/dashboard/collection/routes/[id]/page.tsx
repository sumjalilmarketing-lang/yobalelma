import { OperationForm } from "@/components/operations/operation-form";
import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detail tournee | Yobalelma",
};

export default async function CollectionRouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await requireRole(["collection_driver"], `/dashboard/collection/routes/${id}`);

  return (
    <PageShell
      eyebrow="Collecte"
      title="Detail tournee"
      description="Ajoute les relais a visiter et consulte l'ordre de collecte."
    >
      {state.status === "ready" ? (
        <div className="grid gap-8">
          <OperationForm
            title="Ajouter un arret"
            endpoint={`/api/collection/routes/${id}`}
            submitLabel="Ajouter l'arret"
            fields={[
              { name: "relayPointId", label: "ID point relais", required: true },
              { name: "stopOrder", label: "Ordre", type: "number", required: true },
            ]}
          />
          <Stops routeId={id} />
        </div>
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}

async function Stops({ routeId }: { routeId: string }) {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const { data, error } = await supabase
    .from("collection_route_stops")
    .select("id, stop_order, status, arrived_at, completed_at, relay_points(name, city, country)")
    .eq("route_id", routeId)
    .order("stop_order", { ascending: true });

  if (error) {
    return <EmptyState title="Chargement impossible" description={error.message} />;
  }

  if (!data?.length) {
    return <EmptyState title="Aucun arret" description="Ajoute les points relais de la tournee." />;
  }

  return (
    <DataGrid>
      {data.map((stop) => {
        const relay = Array.isArray(stop.relay_points) ? stop.relay_points[0] : stop.relay_points;

        return (
          <DataCard
            key={stop.id}
            title={`Arret ${stop.stop_order}`}
            subtitle={stop.status}
            rows={[
              { label: "Relais", value: relay ? `${relay.name}, ${relay.city}` : "Non charge" },
              { label: "Arrivee", value: stop.arrived_at ?? "Non" },
              { label: "Termine", value: stop.completed_at ?? "Non" },
            ]}
          />
        );
      })}
    </DataGrid>
  );
}
