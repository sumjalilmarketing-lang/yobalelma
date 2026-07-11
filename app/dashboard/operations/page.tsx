import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { Button } from "@/components/ui/button";
import { JourneyVisualStage } from "@/components/visual/yobalelma-world";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Operations | Yobalelma",
};

export default async function OperationsDashboardPage() {
  const state = await requireRole(
    ["operations_manager", "admin", "super_admin"],
    "/dashboard/operations",
  );

  return (
    <PageShell
      eyebrow="Operations"
      title="Pilotage operations"
      description="Accede aux modules internes hub, relais, collecte, support et administration."
    >
      {state.status === "ready" ? (
        <div className="grid gap-6">
          <JourneyVisualStage scene="operations" />
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/hub">Hub</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/relay">Relais</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/collection">Collecte</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/support">Support</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/admin">Admin</Link>
            </Button>
          </div>
        </div>
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}
