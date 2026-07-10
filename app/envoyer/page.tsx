import Link from "next/link";
import { ParcelRequestForm } from "@/components/forms/parcel-request-form";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Envoyer un colis | Yobalelma",
};

export default function EnvoyerPage() {
  return (
    <PageShell
      eyebrow="Expediteur"
      title="Publier une demande d'envoi"
      description="Decris ton colis, le trajet souhaite et la date limite. Yobalelma le rend visible aux voyageurs compatibles."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-black/10 bg-white p-6 shadow-sm">
          <ParcelRequestForm />
        </div>
        <aside className="grid gap-4 self-start rounded-lg bg-black p-6 text-white">
          <h2 className="text-2xl font-black">Avant de publier</h2>
          <p className="leading-7 text-white/70">
            Connecte-toi, indique un colis transportable et evite les objets interdits.
            La validation finale reste entre l&apos;expediteur et le voyageur.
          </p>
          <Button asChild variant="secondary">
            <Link href="/auth/sign-in">Me connecter</Link>
          </Button>
        </aside>
      </div>
    </PageShell>
  );
}
