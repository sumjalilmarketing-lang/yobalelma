import { FinalDeliveryDetail } from "@/components/final-delivery/final-delivery-dashboard";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice, EmptyState } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { loadFinalDeliveryOrderByShipment } from "@/lib/final-delivery/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inventaire destination | Yobalelma",
};

export default async function RelayInventoryShipmentPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = await params;
  const state = await requireRole(["relay_agent", "relay_manager", "operations_manager", "admin", "super_admin"], `/dashboard/relay/inventory/${shipmentId}`);

  if (state.status !== "ready") {
    return (
      <PageShell eyebrow="Relais" title="Inventaire destination" description="Detail stock et remise finale." scene="relay">
        <ConfigurationNotice />
      </PageShell>
    );
  }

  const { events, order, otps, proofs, error } = await loadFinalDeliveryOrderByShipment(shipmentId);

  return (
    <PageShell eyebrow="Relais" title="Inventaire destination" description="Detail stock et remise finale." scene="relay">
      {error ? <EmptyState title="Lecture partielle" description={error} /> : null}
      <FinalDeliveryDetail events={events} order={order} otps={otps} proofs={proofs} />
    </PageShell>
  );
}
