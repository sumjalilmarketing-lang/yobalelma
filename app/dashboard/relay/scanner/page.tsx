import { RelayForms } from "@/components/forms/relay-forms";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scanner relais | Yobalelma",
};

export default async function RelayScannerPage() {
  const state = await requireRole(["relay_agent"], "/dashboard/relay/scanner");

  return (
    <PageShell
      eyebrow="Relais"
      title="Scanner relais"
      description="Enregistre les entrees, sorties, remises et exceptions avec tracking event."
    >
      {state.status === "ready" ? <RelayForms /> : <ConfigurationNotice />}
    </PageShell>
  );
}
