import Link from "next/link";
import { UserRoundPlus } from "lucide-react";
import {
  PremiumChecklist,
  PremiumPanel,
  PremiumStory,
} from "@/components/design-system/premium";
import { SignUpForm } from "@/components/forms/password-auth-forms";
import { PageShell } from "@/components/layout/page-shell";

export const metadata = {
  title: "Inscription | Yobalelma",
};

export default function SignUpPage() {
  return (
    <PageShell
      eyebrow="Inscription"
      title="Creer ton compte Yobalelma"
      description="Choisis ton role public et complete les informations necessaires pour demarrer."
    >
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <PremiumStory
          tone="client"
          eyebrow="Bienvenue"
          title="Choisis ton role et demarre avec une experience adaptee."
          description="Yobalelma prepare des espaces differents pour les clients, voyageurs et livreurs afin de garder les actions simples."
          icon={UserRoundPlus}
        >
          <PremiumChecklist
            tone="client"
            items={[
              "Role public choisi des l'inscription.",
              "Profil cree pour rattacher les futures operations.",
              "KYC et documents ajoutes ensuite dans le dashboard.",
            ]}
          />
        </PremiumStory>

        <PremiumPanel tone="client" className="grid gap-6 p-6">
          <SignUpForm />
          <Link href="/auth/sign-in" className="text-sm font-bold text-primary">
            J&apos;ai deja un compte
          </Link>
        </PremiumPanel>
      </div>
    </PageShell>
  );
}
