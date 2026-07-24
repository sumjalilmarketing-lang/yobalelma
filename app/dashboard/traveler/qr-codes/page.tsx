import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { toBusinessStatusLabel } from "@/lib/presentation/business-labels";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "QR voyageur | Yobalelma",
};

export default async function TravelerQrCodesPage() {
  const state = await requireRole(["traveler"], "/dashboard/traveler/qr-codes");

  return (
    <PageShell
      eyebrow="Voyageur"
      title="QR de lots"
      description="Consulte les QR de retrait et destination qui te sont lies, sans exposer les tokens haches."
    >
      {state.status === "ready" ? <QrList userId={state.userId} /> : <ConfigurationNotice />}
    </PageShell>
  );
}

async function QrList({ userId }: { userId: string }) {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const { data, error } = await supabase
    .from("handover_qr_tokens")
    .select("id, token_type, status, batch_id, trip_id, expires_at, used_at, created_at")
    .eq("traveler_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return <EmptyState title="Chargement impossible" description="Vos codes de remise ne sont pas disponibles pour le moment. Réessayez dans quelques instants." />;
  }

  if (!data?.length) {
    return <EmptyState title="Aucun QR" description="Les QR apparaitront apres creation de lot par le hub." />;
  }

  return (
    <DataGrid>
      {data.map((token) => (
        <DataCard
          key={token.id}
          title={token.token_type === "destination_dropoff" ? "Remise à destination" : "Prise en charge du lot"}
          subtitle={toBusinessStatusLabel(token.status)}
          rows={[
            { label: "Expire", value: new Date(token.expires_at).toLocaleString("fr-FR") },
            { label: "Utilise", value: token.used_at ? new Date(token.used_at).toLocaleString("fr-FR") : "Non" },
          ]}
        />
      ))}
    </DataGrid>
  );
}
