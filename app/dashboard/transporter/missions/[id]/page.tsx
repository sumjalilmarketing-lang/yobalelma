import { PageShell } from "@/components/layout/page-shell";
import { OperationForm } from "@/components/operations/operation-form";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detail mission | Yobalelma",
};

export default async function TransporterMissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await requireRole(["local_transporter"], `/dashboard/transporter/missions/${id}`);

  return (
    <PageShell
      eyebrow="Livreur"
      title="Detail mission"
      description="Pilote l'enlevement, le retrait et la remise avec un controle clair a chaque etape."
    >
      {state.status === "ready" ? (
        <MissionDetail missionId={id} userId={state.userId} />
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}

async function MissionDetail({
  missionId,
  userId,
}: {
  missionId: string;
  userId: string;
}) {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const { data, error } = await supabase
    .from("local_delivery_missions")
    .select("*, shipments(tracking_code, origin_city, origin_country, destination_city, destination_country, status)")
    .eq("id", missionId)
    .eq("transporter_id", userId)
    .maybeSingle();

  if (error) {
    return <EmptyState title="Mission introuvable" description={error.message} />;
  }

  if (!data) {
    return <EmptyState title="Mission introuvable" description="Aucune mission livreur ne correspond a cet identifiant." />;
  }

  const shipment = Array.isArray(data.shipments) ? data.shipments[0] : data.shipments;

  return (
    <div className="grid gap-8">
      <DataGrid>
        <DataCard
          title={shipment?.tracking_code ?? data.shipment_id}
          subtitle={data.status}
          rows={[
            { label: "Score", value: data.score },
            { label: "Depart", value: shipment ? `${shipment.origin_city}, ${shipment.origin_country}` : "Non charge" },
            { label: "Destination", value: shipment ? `${shipment.destination_city}, ${shipment.destination_country}` : "Non charge" },
            { label: "OTP client", value: "Saisie requise par destinataire" },
          ]}
        />
      </DataGrid>
      <OperationForm
        title="Action mission"
        description="Accepter, confirmer l'arrivee, le retrait, puis la livraison finale."
        endpoint={`/api/transporters/missions/${missionId}`}
        method="PATCH"
        submitLabel="Executer l'action"
        fields={[
          {
            name: "action",
            label: "Action",
            type: "select",
            options: [
              { label: "Accepter", value: "accept" },
              { label: "Arrive au retrait", value: "arrive" },
              { label: "Colis retire", value: "pickup" },
              { label: "Livraison confirmee", value: "deliver" },
            ],
            required: true,
          },
          { name: "deliveryOtp", label: "OTP livraison", type: "text" },
          { name: "proofPath", label: "Preuve de livraison Storage", type: "text" },
        ]}
      />
    </div>
  );
}
