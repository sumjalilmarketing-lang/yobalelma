import { RoleDashboard } from "@/components/dashboard/role-dashboard";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Espace livreur | Yobalelma",
};

export default async function TransporterDashboardPage() {
  const state = await requireRole(["local_transporter"], "/dashboard/transporter");

  return (
    <PageShell
      eyebrow="Livreur"
      title="Espace livreur local"
      description="Prepare les collectes, les remises et les controles necessaires avant de transporter."
    >
      {state.status === "ready" ? (
        <RoleDashboard
          email={state.email}
          roleLabel="Compte livreur"
          title="Operations locales"
          description="Cet espace servira de base aux missions de collecte, depot relais et livraison finale."
          actions={[
            { href: "/dashboard/transporter/missions", label: "Mes missions" },
            { href: "/dashboard/transporter/missions/available", label: "Disponibles", variant: "secondary" },
            { href: "/dashboard/transporter/missions/active", label: "Actives", variant: "secondary" },
            { href: "/dashboard/transporter/earnings", label: "Gains", variant: "secondary" },
            { href: "/dashboard/transporter/vehicle", label: "Vehicule", variant: "secondary" },
            { href: "/dashboard/transporter/zones", label: "Zones", variant: "secondary" },
            { href: "/dashboard/transporter/availability", label: "Disponibilite", variant: "secondary" },
            { href: "/dashboard/transporter/profile", label: "Profil", variant: "secondary" },
            { href: "/dashboard/transporter/support", label: "Support", variant: "secondary" },
          ]}
          checkpoints={[
            "Role livreur local isole des roles internes d'administration.",
            "KYC obligatoire avant activation operationnelle.",
            "Flux de collecte et remise prevus pour les prochaines phases.",
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
        l&apos;espace livreur.
      </p>
    </div>
  );
}
