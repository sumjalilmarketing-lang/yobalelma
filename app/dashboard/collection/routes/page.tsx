import { OperationForm } from "@/components/operations/operation-form";
import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tournees collecte | Yobalelma",
};

export default async function CollectionRoutesPage() {
  const state = await requireRole(["collection_driver", "collection_manager"], "/dashboard/collection/routes");

  return (
    <PageShell
      eyebrow="Collecte"
      title="Tournees"
      description="Cree une tournee, puis ajoute les arrets relais dans l'ordre de passage."
    >
      {state.status === "ready" ? (
        <div className="grid gap-8">
          <OperationForm
            title="Nouvelle tournee"
            endpoint="/api/collection/routes"
            submitLabel="Creer la tournee"
            fields={[
              { name: "name", label: "Nom", required: true },
              { name: "routeDate", label: "Date", type: "date", required: true },
              { name: "driverId", label: "ID chauffeur", defaultValue: state.userId },
            ]}
          />
          <RouteList />
        </div>
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}

async function RouteList() {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const { data, error } = await supabase
    .from("collection_routes")
    .select("id, name, route_date, status, driver_id")
    .order("route_date", { ascending: false });

  if (error) {
    return <EmptyState title="Chargement impossible" description={error.message} />;
  }

  if (!data?.length) {
    return <EmptyState title="Aucune tournee" description="Cree une premiere tournee pour organiser la collecte." />;
  }

  return (
    <DataGrid>
      {data.map((route) => (
        <DataCard
          key={route.id}
          title={route.name}
          subtitle={route.status}
          href={`/dashboard/collection/routes/${route.id}`}
          rows={[
            { label: "Date", value: route.route_date },
            { label: "Chauffeur", value: route.driver_id ?? "Non assigne" },
          ]}
        />
      ))}
    </DataGrid>
  );
}
