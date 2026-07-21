import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { toBusinessStatusLabel } from "@/lib/presentation/business-labels";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Missions livreur | Yobalelma",
};

export default async function TransporterMissionsPage() {
  const state = await requireRole(["local_transporter"], "/dashboard/transporter/missions");

  return (
    <PageShell
      eyebrow="Livreur"
      title="Missions d'enlevement et livraison"
      description="Accepte les missions proposees, confirme le retrait puis la livraison avec OTP."
    >
      {state.status === "ready" ? <MissionList userId={state.userId} /> : <ConfigurationNotice />}
    </PageShell>
  );
}

async function MissionList({ userId }: { userId: string }) {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const { data, error } = await supabase
    .from("local_delivery_missions")
    .select("id, shipment_id, status, score, reason, offered_at, accepted_at, picked_up_at, delivered_at, shipments(tracking_code, origin_city, origin_country, destination_city, destination_country, status)")
    .eq("transporter_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return <EmptyState title="Chargement impossible" description="Vos missions ne sont pas disponibles pour le moment. Réessayez dans quelques instants." />;
  }

  if (!data?.length) {
    return <EmptyState title="Aucune mission" description="Les nouvelles missions qui te sont proposées apparaîtront ici." />;
  }

  return (
    <DataGrid>
      {data.map((mission) => {
        const shipment = Array.isArray(mission.shipments)
          ? mission.shipments[0]
          : mission.shipments;

        return (
          <DataCard
            key={mission.id}
            title={shipment?.tracking_code ?? "Mission de livraison"}
            subtitle={toBusinessStatusLabel(mission.status)}
            href={`/dashboard/transporter/missions/${mission.id}`}
            rows={[
              { label: "Score", value: mission.score },
              { label: "Trajet", value: shipment ? `${shipment.origin_city} -> ${shipment.destination_city}` : "Non charge" },
              { label: "Offerte", value: mission.offered_at ? new Date(mission.offered_at).toLocaleString("fr-FR") : "Non" },
            ]}
          />
        );
      })}
    </DataGrid>
  );
}
