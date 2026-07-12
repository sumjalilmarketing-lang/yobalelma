import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import {
  PremiumChecklist,
  PremiumPanel,
  PremiumStory,
} from "@/components/design-system/premium";
import { AuthForm } from "@/components/forms/auth-form";
import { PasswordSignInForm } from "@/components/forms/password-auth-forms";
import { PageShell } from "@/components/layout/page-shell";

export const metadata = {
  title: "Connexion | Yobalelma",
};

export default function SignInPage() {
  return (
    <PageShell
      eyebrow="Compte"
      title="Connexion securisee"
      description="Connecte-toi avec ton mot de passe ou recois un lien magique par email."
    >
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <PremiumStory
          tone="admin"
          eyebrow="Acces protege"
          title="Entre dans ton espace Yobalelma avec une connexion claire et securisee."
          description="Les parcours client, voyageur, livreur et operations restent separes par role et permissions."
          icon={LockKeyhole}
        >
          <PremiumChecklist
            tone="admin"
            items={[
              "Sessions gerees par Supabase Auth.",
              "Redirection vers le dashboard du role.",
              "Donnees rattachees au projet Yobalelma uniquement.",
            ]}
          />
        </PremiumStory>

        <PremiumPanel tone="admin" className="grid gap-6 p-6">
          <ShieldCheck className="h-8 w-8 text-primary" aria-hidden="true" />
          <PasswordSignInForm />
          <div className="border-t border-black/10 pt-6">
            <p className="mb-4 text-sm font-bold text-black/50">Ou recevoir un lien magique</p>
            <AuthForm />
          </div>
          <p className="text-sm leading-6 text-black/60">
            En continuant, tu rejoins la plateforme Yobalelma. Les donnees sont
            rattachees au projet Supabase Yobalelma uniquement.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/auth/sign-up" className="text-sm font-bold text-primary">
              Creer un compte
            </Link>
            <Link href="/auth/forgot-password" className="text-sm font-bold text-primary">
              Mot de passe oublie
            </Link>
          </div>
          <Link href="/" className="text-sm font-bold text-primary">
            Retour a l&apos;accueil
          </Link>
        </PremiumPanel>
        </div>
    </PageShell>
  );
}
