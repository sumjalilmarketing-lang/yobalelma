import { KycForm } from "@/components/forms/kyc-form";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vérification d’identité | Yobalelma",
};

export default async function KycPage() {
  const state = await requireRole(
    ["client", "local_transporter", "traveler"],
    "/dashboard/kyc",
  );

  return (
    <PageShell
      eyebrow="Confiance"
      title="Vérification d’identité"
      description="Transmets les informations nécessaires pour sécuriser ton compte Yobalelma."
    >
      {state.status === "ready" ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="rounded-lg border border-black/10 bg-white p-6 shadow-line">
            <KycForm />
          </div>
          <aside className="grid gap-4 self-start rounded-lg bg-black p-6 text-white">
            <h2 className="text-2xl font-black">Controle de confiance</h2>
            <p className="leading-7 text-white/70">
              Tes documents sont traites dans un espace prive. Yobalelma ne montre
              jamais ces pieces aux autres utilisateurs.
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
      <h2 className="text-2xl font-black">Connexion au service indisponible</h2>
      <p className="mt-3 max-w-2xl leading-7 text-black/60">
        Ce service est momentanément indisponible. Réessaie dans quelques instants ou contacte l&apos;assistance Yobalelma.
      </p>
    </div>
  );
}
