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
            { href: "/voyager", label: "Publier un trajet" },
            { href: "/dashboard/kyc", label: "Verification KYC", variant: "secondary" },
            { href: "/dashboard", label: "Vue globale", variant: "secondary" },
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
      <p className="mt-3 max-w-2xl leading-7 text-black/65">
        Ajoute les variables publiques Yobalelma dans l&apos;environnement pour activer
        l&apos;espace voyageur.
      </p>
    </div>
  );
}
