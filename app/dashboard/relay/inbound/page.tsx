import { RelayForms } from "@/components/forms/relay-forms";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Entrees relais | Yobalelma",
};

export default async function RelayInboundPage() {
  const state = await requireRole(["relay_agent", "relay_manager"], "/dashboard/relay/inbound");

  return (
    <PageShell
      eyebrow="Relais"
      title="Reception colis"
      description="Scanne ou saisis un tracking code pour receptionner un colis en point relais."
    >
      {state.status === "ready" ? <RelayForms /> : <ConfigurationNotice />}
    </PageShell>
  );
}
