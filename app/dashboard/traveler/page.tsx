import { RoleDashboard } from "@/components/dashboard/role-dashboard";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Espace voyageur | Yobalelma",
};

export default async function TravelerDashboardPage() {
  const state = await requireRole(["traveler"], "/dashboard/traveler");

  return (
    <PageShell
      eyebrow="Voyageur"
      title="Espace voyageur Yobalelma"
      description="Publie tes trajets, prepare ta capacite disponible et suis les demandes compatibles."
    >
      {state.status === "ready" ? (
        <RoleDashboard
          email={state.email}
          roleLabel="Compte voyageur"
          title="Voyages et colis compatibles"
          description="Ton espace voyageur structure les trajets disponibles avant le moteur de matching complet."
          actions={[
            { href: "/dashboard/traveler/international", label: "Parcours international" },
            { href: "/dashboard/traveler/trips/new", label: "Ajouter un voyage" },
            { href: "/dashboard/traveler/trips", label: "Mes voyages", variant: "secondary" },
            { href: "/dashboard/traveler/tickets", label: "Billets", variant: "secondary" },
            { href: "/dashboard/traveler/capacity", label: "Capacite", variant: "secondary" },
            { href: "/dashboard/traveler/assignments", label: "Assignations", variant: "secondary" },
            { href: "/dashboard/traveler/qr-codes", label: "QR lots", variant: "secondary" },
            { href: "/dashboard/traveler/earnings", label: "Gains", variant: "secondary" },
            { href: "/dashboard/traveler/support", label: "Support", variant: "secondary" },
          ]}
          checkpoints={[
            "Trajets relies au compte voyageur authentifie.",
            "Verification d'identite prete pour renforcer la confiance.",
            "Matching colis-voyages prevu dans les prochaines phases.",
          ]}
        />
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
        Ajoute les variables publiques Yobalelma dans l&apos;environnement pour activer
        l&apos;espace voyageur.
      </p>
    </div>
  );
}
