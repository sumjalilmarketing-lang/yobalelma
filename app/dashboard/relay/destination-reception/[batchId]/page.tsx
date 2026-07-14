import { DestinationReceptionForm } from "@/components/final-delivery/final-delivery-forms";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reception lot destination | Yobalelma",
};

export default async function RelayDestinationBatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const state = await requireRole(
    ["relay_agent", "relay_manager", "operations_manager", "admin", "super_admin"],
    `/dashboard/relay/destination-reception/${batchId}`,
  );

  return (
    <PageShell
      eyebrow="Relais"
      title="Reception lot destination"
      description={`Reception controlee du lot ${batchId}: colis attendus, stock destination et choix de remise.`}
      scene="relay"
    >
      {state.status === "ready" ? <DestinationReceptionForm /> : <ConfigurationNotice />}
    </PageShell>
  );
}
