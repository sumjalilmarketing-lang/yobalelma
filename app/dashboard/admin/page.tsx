import Link from "next/link";
import { PaymentIntentForm } from "@/components/forms/operations-forms";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { JourneyVisualStage } from "@/components/visual/yobalelma-world";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin | Yobalelma",
};

export default async function AdminDashboardPage() {
  const state = await requireRole(
    ["operations_manager", "support_agent", "finance_agent", "admin", "super_admin"],
    "/dashboard/admin",
  );

  return (
    <PageShell
      eyebrow="Admin"
      title="Back-office Yobalelma"
      description="Controle sandbox des paiements, audit et operations sensibles."
    >
      {state.status === "ready" ? (
        <div className="grid gap-8">
          <JourneyVisualStage scene="admin" />
          <div className="flex flex-wrap gap-3">
            {[
              ["Utilisateurs", "/dashboard/admin/users"],
              ["KYC", "/dashboard/admin/kyc"],
              ["Expeditions", "/dashboard/admin/shipments"],
              ["Hubs", "/dashboard/admin/hubs"],
              ["Paiements", "/dashboard/admin/payments"],
              ["Payouts", "/dashboard/admin/payouts"],
              ["Audit", "/dashboard/admin/audit"],
              ["Sante systeme", "/dashboard/admin/system-health"],
            ].map(([label, href], index) => (
              <Button key={href} asChild variant={index === 0 ? "default" : "secondary"}>
                <Link href={href}>{label}</Link>
              </Button>
            ))}
          </div>
          <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
            <PaymentIntentForm />
            <section className="rounded-lg border border-black/10 bg-white p-5 shadow-line">
              <h2 className="text-xl font-black">Audit et analytics</h2>
              <p className="mt-3 leading-7 text-black/60">
                Les journaux operationnels et les indicateurs quotidiens sont prets
                pour le pilotage interne, les controles sensibles et les revues support.
              </p>
            </section>
          </div>
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
        Ajoute les variables publiques Yobalelma pour activer le back-office.
      </p>
    </div>
  );
}
