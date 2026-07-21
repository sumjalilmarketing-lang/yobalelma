import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { toBusinessStatusLabel } from "@/lib/presentation/business-labels";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mes expeditions | Yobalelma",
};

export default async function ClientShipmentsPage() {
  const state = await requireRole(["client"], "/dashboard/client/shipments");

  return (
    <PageShell
      eyebrow="Client"
      title="Mes expeditions"
      description="Suis les envois créés, leur code de suivi, le mode de départ et leur statut."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/dashboard/client/shipments/new">Nouvelle expédition</Link>
        </Button>
      </div>
      {state.status === "ready" ? <ShipmentList userId={state.userId} /> : <ConfigurationNotice />}
    </PageShell>
  );
}

async function ShipmentList({ userId }: { userId: string }) {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const { data, error } = await supabase
    .from("shipments")
    .select("id, tracking_code, scope, status, origin_city, origin_country, destination_city, destination_country, fulfillment_method, estimated_price_cents, currency, created_at")
    .eq("sender_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return <EmptyState title="Chargement impossible" description="Vos expéditions ne sont pas disponibles pour le moment. Réessayez dans quelques instants." />;
  }

  if (!data?.length) {
    return (
      <EmptyState
        title="Aucune expédition"
        description="Cree une expedition pour declencher tracking, pickup request ou depot relais."
        action={{ href: "/dashboard/client/shipments/new", label: "Créer une expédition" }}
      />
    );
  }

  return (
    <DataGrid>
      {data.map((shipment) => (
        <DataCard
          key={shipment.id}
          title={shipment.tracking_code}
          subtitle={`${shipment.origin_city}, ${shipment.origin_country} -> ${shipment.destination_city}, ${shipment.destination_country}`}
          href={`/dashboard/client/shipments/${shipment.id}`}
          rows={[
            { label: "Statut", value: toBusinessStatusLabel(shipment.status) },
            { label: "Trajet", value: shipment.scope === "international" ? "International" : "National" },
            { label: "Départ", value: shipment.fulfillment_method === "pickup" ? "Enlèvement à domicile" : "Dépôt en point relais" },
            {
              label: "Prix",
              value: `${(shipment.estimated_price_cents / 100).toFixed(2)} ${shipment.currency}`,
            },
          ]}
        />
      ))}
    </DataGrid>
  );
}
