import Link from "next/link";
import { LifeBuoy, ShieldCheck } from "lucide-react";
import {
  PremiumChecklist,
  PremiumStory,
} from "@/components/design-system/premium";
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
      <PremiumStory
        tone="support"
        eyebrow="Assistance rassurante"
        title="Un support clair pour les incidents, paiements, preuves et verifications."
        description="Chaque ticket doit permettre de comprendre le contexte, prioriser l'urgence et proteger les donnees du client."
        icon={LifeBuoy}
      >
        <PremiumChecklist
          tone="support"
          items={[
            "Ticket rattache a un compte connecte.",
            "Messages et preuves centralises.",
            "Escalade possible vers operations ou admin.",
          ]}
        />
      </PremiumStory>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <SupportTicketForm />
        <aside className="grid gap-4 self-start rounded-lg bg-secondary p-6 text-white shadow-panel">
          <ShieldCheck className="h-8 w-8 text-primary" aria-hidden="true" />
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
