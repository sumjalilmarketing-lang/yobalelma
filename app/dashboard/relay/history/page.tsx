import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { loadAdminFinalDeliveryAudit } from "@/lib/final-delivery/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Historique destination | Yobalelma",
};

export default async function RelayHistoryPage() {
  const state = await requireRole(["relay_agent", "relay_manager", "operations_manager", "admin", "super_admin"], "/dashboard/relay/history");

  if (state.status !== "ready") {
    return (
      <PageShell eyebrow="Relais" title="Historique destination" description="Evenements de livraison finale et anomalies destination." scene="relay">
        <ConfigurationNotice />
      </PageShell>
    );
  }

  const { events, error } = await loadAdminFinalDeliveryAudit();

  return (
    <PageShell eyebrow="Relais" title="Historique destination" description="Evenements de livraison finale et anomalies destination." scene="relay">
      {error ? <EmptyState title="Lecture impossible" description={error} /> : null}
      {events.length ? (
        <DataGrid>
          {events.map((event) => (
            <DataCard
              key={event.id}
              title={event.status}
              subtitle={event.event_type}
              href={`/dashboard/relay/final-delivery/${event.shipment_id}`}
              rows={[
                { label: "Expedition", value: event.shipment_id },
                { label: "Note", value: event.note ?? "Sans note" },
                { label: "Date", value: new Date(event.created_at).toLocaleString("fr-FR") },
              ]}
            />
          ))}
        </DataGrid>
      ) : (
        <EmptyState title="Aucun evenement" description="Les controles destination apparaitront ici." />
      )}
    </PageShell>
  );
}
