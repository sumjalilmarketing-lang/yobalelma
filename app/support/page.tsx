import Link from "next/link";
import { SupportTicketForm } from "@/components/forms/operations-forms";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Support | Yobalelma",
};

export default function SupportPage() {
  return (
    <PageShell
      eyebrow="Support"
      title="Contacter Yobalelma"
      description="Ouvre un ticket pour une expedition, un paiement, une verification ou un incident."
      scene="support"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <SupportTicketForm />
        <aside className="grid gap-4 self-start rounded-lg bg-secondary p-6 text-white shadow-panel">
          <h2 className="text-2xl font-black">Compte requis</h2>
          <p className="leading-7 text-white/70">
            Connecte-toi pour rattacher le ticket a ton compte et suivre les reponses.
          </p>
          <Button asChild variant="secondary">
            <Link href="/auth/sign-in?next=/support">Connexion</Link>
          </Button>
        </aside>
      </div>
    </PageShell>
  );
}
