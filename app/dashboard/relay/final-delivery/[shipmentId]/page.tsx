import {
  AdminOverrideForm,
  DeliveryChoiceForm,
  DeliveryOtpPanel,
  FinalDeliveryAttemptForm,
  FinalMileMissionForm,
} from "@/components/final-delivery/final-delivery-forms";
import { FinalDeliveryDetail } from "@/components/final-delivery/final-delivery-dashboard";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice, EmptyState } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { loadFinalDeliveryOrderByShipment } from "@/lib/final-delivery/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detail livraison finale | Yobalelma",
};

export default async function RelayFinalDeliveryDetailPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = await params;
  const state = await requireRole(
    ["relay_agent", "relay_manager", "operations_manager", "support_agent", "admin", "super_admin"],
    `/dashboard/relay/final-delivery/${shipmentId}`,
  );

  if (state.status !== "ready") {
    return (
      <PageShell
        eyebrow="Relais"
        title="Detail livraison finale"
        description="Commande destination, OTP, preuve, missions et audit."
        scene="relay"
      >
        <ConfigurationNotice />
      </PageShell>
    );
  }

  const { events, order, otps, proofs, error } = await loadFinalDeliveryOrderByShipment(shipmentId);

  return (
    <PageShell
      eyebrow="Relais"
      title="Detail livraison finale"
      description="Commande destination, OTP, preuve, missions et audit."
      scene="relay"
    >
      <div className="grid gap-8">
        {error ? <EmptyState title="Lecture partielle" description={error} /> : null}
        <FinalDeliveryDetail events={events} order={order} otps={otps} proofs={proofs} />
        <section className="grid gap-6 xl:grid-cols-2">
          <DeliveryChoiceForm shipmentId={shipmentId} />
          <FinalMileMissionForm shipmentId={shipmentId} />
          <FinalDeliveryAttemptForm shipmentId={shipmentId} />
          <AdminOverrideForm shipmentId={shipmentId} />
        </section>
        <DeliveryOtpPanel deliveryMode={order?.delivery_mode ?? "relay_pickup"} shipmentId={shipmentId} />
      </div>
    </PageShell>
  );
}
