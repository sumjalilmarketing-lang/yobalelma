import {
  SupportMessageForm,
  SupportTicketForm,
} from "@/components/forms/operations-forms";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Support | Yobalelma",
};

export default async function SupportDashboardPage() {
  const state = await requireRole(
    ["support_agent", "operations_manager", "admin", "super_admin"],
    "/dashboard/support",
  );

  return (
    <PageShell
      eyebrow="Support"
      title="Support et litiges"
      description="Ouvre, suis et alimente les tickets support rattaches aux expeditions."
    >
      {state.status === "ready" ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <SupportTicketForm />
          <SupportMessageForm />
        </div>
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}

function ConfigurationNotice() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-2xl font-black">Configuration Supabase requise</h2>
      <p className="mt-3 max-w-2xl leading-7 text-black/60">
        Ajoute les variables publiques Yobalelma pour activer le support.
      </p>
    </div>
  );
}
