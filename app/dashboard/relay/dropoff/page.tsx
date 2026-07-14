import { RelayForms } from "@/components/forms/relay-forms";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Depot relais | Yobalelma",
};

export default async function RelayDropoffPage() {
  const state = await requireRole(
    ["relay_agent", "relay_manager", "operations_manager", "admin", "super_admin"],
    "/dashboard/relay/dropoff",
  );

  return (
    <PageShell
      eyebrow="Relais"
      title="Depot colis international"
      description="Cree ou selectionne un point relais, puis scanne le colis depose par le client ou le livreur local."
      scene="relay"
    >
      {state.status === "ready" ? <RelayForms /> : <ConfigurationNotice />}
    </PageShell>
  );
}
