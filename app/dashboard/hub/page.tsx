import Link from "next/link";
import { HubForms } from "@/components/forms/hub-forms";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { Button } from "@/components/ui/button";
import { JourneyVisualStage } from "@/components/visual/yobalelma-world";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hub | Yobalelma",
};

export default async function HubDashboardPage() {
  const state = await requireRole(
    ["hub_agent", "hub_manager", "operations_manager", "admin", "super_admin"],
    "/dashboard/hub",
  );

  return (
    <PageShell
      eyebrow="Hub"
      title="Hub, batches et capacite"
      description="Cree des batches hub, reserve la capacite et prepare les consolidations voyageur."
    >
      {state.status === "ready" ? (
        <div className="grid gap-6">
          <JourneyVisualStage scene="hub" />
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/hub/batches">Batches</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/hub/inbound">Reception</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/hub/handover">QR handover</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/hub/inventory">Inventaire</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/hub/storage">Stockage</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/hub/inspection">Inspection</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/hub/scanner">Scanner</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/hub/anomalies">Anomalies</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/hub/reports">Rapports</Link>
            </Button>
          </div>
          <HubForms />
        </div>
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}
