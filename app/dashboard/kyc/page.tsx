import { KycForm } from "@/components/forms/kyc-form";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Verification KYC | Yobalelma",
};

export default async function KycPage() {
  const state = await requireRole(
    ["client", "local_transporter", "traveler"],
    "/dashboard/kyc",
  );

  return (
    <PageShell
      eyebrow="KYC"
      title="Verification d'identite"
      description="Soumets les informations d'identite rattachees a ton compte Yobalelma."
    >
      {state.status === "ready" ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="rounded-lg border border-black/10 bg-white p-6 shadow-sm">
            <KycForm />
          </div>
          <aside className="grid gap-4 self-start rounded-lg bg-black p-6 text-white">
            <h2 className="text-2xl font-black">Controle de confiance</h2>
            <p className="leading-7 text-white/70">
              Les fichiers doivent etre stockes dans le bucket prive KYC du projet
              Supabase Yobalelma. Cette phase prepare le workflow sans exposer de
              secret cote client.
            </p>
            <p className="text-sm font-bold text-white/60">{state.email}</p>
          </aside>
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
      <p className="mt-3 max-w-2xl leading-7 text-black/65">
        Ajoute les variables publiques Yobalelma dans l&apos;environnement pour activer
        le depot KYC.
      </p>
    </div>
  );
}
