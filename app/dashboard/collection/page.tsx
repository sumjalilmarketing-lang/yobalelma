import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Collecte | Yobalelma",
};

export default async function CollectionDashboardPage() {
  const state = await requireRole(["collection_driver", "collection_manager"], "/dashboard/collection");

  return (
    <PageShell
      eyebrow="Collecte"
      title="Collecte Yobalelma"
      description="Gere les tournees entre points relais et hub sans melanger ce role avec les livreurs locaux."
    >
      {state.status === "ready" ? (
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/collection/routes">Tournees</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/collection/scanner">Scanner</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/collection/manifests">Manifestes</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/collection/stops">Arrets</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/collection/incidents">Incidents</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/collection/history">Historique</Link>
          </Button>
        </div>
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}
