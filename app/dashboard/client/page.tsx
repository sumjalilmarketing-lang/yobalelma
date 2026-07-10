import { RoleDashboard } from "@/components/dashboard/role-dashboard";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Espace client | Yobalelma",
};

export default async function ClientDashboardPage() {
  const state = await requireRole(["client"], "/dashboard/client");

  return (
    <PageShell
      eyebrow="Client"
      title="Espace client Yobalelma"
      description="Prepare tes envois, suis les demandes et finalise la verification de ton compte."
    >
      {state.status === "ready" ? (
        <RoleDashboard
          email={state.email}
          roleLabel="Compte client"
          title="Chaque voyage devient une livraison"
          description="Ton espace client centralise les prochaines actions pour envoyer un colis via Yobalelma."
          actions={[
            { href: "/envoyer", label: "Envoyer un colis" },
            { href: "/dashboard/kyc", label: "Verification KYC", variant: "secondary" },
            { href: "/dashboard", label: "Vue globale", variant: "secondary" },
          ]}
          checkpoints={[
            "Profil client rattache au projet Supabase Yobalelma.",
            "Verification d'identite prete a etre soumise.",
            "Demandes colis disponibles depuis le formulaire d'envoi.",
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
        l&apos;espace client authentifie.
      </p>
    </div>
  );
}
