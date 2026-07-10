import { HubForms } from "@/components/forms/hub-forms";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hub | Yobalelma",
};

export default async function HubDashboardPage() {
  const state = await requireRole(
    ["hub_agent", "operations_manager", "admin", "super_admin"],
    "/dashboard/hub",
  );

  return (
    <PageShell
      eyebrow="Hub"
      title="Hub, batches et capacite"
      description="Cree des batches hub, reserve la capacite et prepare les consolidations voyageur."
    >
      {state.status === "ready" ? (
        <HubForms />
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-2xl font-black">Configuration Supabase requise</h2>
          <p className="mt-3 max-w-2xl leading-7 text-black/65">
            Ajoute les variables publiques Yobalelma pour activer les operations hub.
          </p>
        </div>
      )}
    </PageShell>
  );
}
