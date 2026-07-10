import { OperationForm } from "@/components/operations/operation-form";
import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manifestes collecte | Yobalelma",
};

export default async function CollectionManifestsPage() {
  const state = await requireRole(["collection_driver"], "/dashboard/collection/manifests");

  return (
    <PageShell
      eyebrow="Collecte"
      title="Manifestes"
      description="Scelle les manifestes de collecte avant remise au hub."
    >
      {state.status === "ready" ? (
        <div className="grid gap-8">
          <OperationForm
            title="Nouveau manifeste"
            endpoint="/api/collection/manifests"
            submitLabel="Creer le manifeste"
            fields={[
              { name: "routeId", label: "ID tournee", required: true },
              { name: "code", label: "Code", defaultValue: "MAN-", required: true },
            ]}
          />
          <ManifestList />
        </div>
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}

async function ManifestList() {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const { data, error } = await supabase
    .from("collection_manifests")
    .select("id, route_id, code, sealed_at, delivered_to_hub_at, incident_note")
    .order("created_at", { ascending: false });

  if (error) {
    return <EmptyState title="Chargement impossible" description={error.message} />;
  }

  if (!data?.length) {
    return <EmptyState title="Aucun manifeste" description="Cree un manifeste pour scanner les colis de collecte." />;
  }

  return (
    <DataGrid>
      {data.map((manifest) => (
        <DataCard
          key={manifest.id}
          title={manifest.code}
          subtitle={manifest.incident_note ?? "Sans incident"}
          rows={[
            { label: "Tournee", value: manifest.route_id },
            { label: "Scelle", value: manifest.sealed_at ?? "Non" },
            { label: "Hub", value: manifest.delivered_to_hub_at ?? "Non remis" },
          ]}
        />
      ))}
    </DataGrid>
  );
}
