import { RelayForms } from "@/components/forms/relay-forms";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Relais | Yobalelma",
};

export default async function RelayDashboardPage() {
  const state = await requireRole(
    ["relay_agent", "hub_agent", "collection_driver", "operations_manager", "admin", "super_admin"],
    "/dashboard/relay",
  );

  return (
    <PageShell
      eyebrow="Relais"
      title="Relais et scans colis"
      description="Cree des points relais, scanne les colis et alimente l'inventaire operationnel."
    >
      {state.status === "ready" ? (
        <RelayForms />
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-2xl font-black">Configuration Supabase requise</h2>
          <p className="mt-3 max-w-2xl leading-7 text-black/65">
            Ajoute les variables publiques Yobalelma pour activer les operations relais.
          </p>
        </div>
      )}
    </PageShell>
  );
}
