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
      title="Connexion sécurisée"
      description="Connecte-toi avec ton mot de passe ou reçois un lien magique par e-mail."
    >
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <PremiumStory
          tone="admin"
          eyebrow="Accès protégé"
          title="Retrouve ton espace Yobalelma en toute simplicité."
          description="Chaque profil donne accès uniquement aux services qui lui correspondent."
          icon={LockKeyhole}
        >
          <PremiumChecklist
            tone="admin"
            items={[
              "Une session personnelle et protégée.",
              "Un accès direct à ton espace.",
              "Tes informations restent confidentielles.",
            ]}
          />
        </PremiumStory>

        <PremiumPanel tone="admin" className="grid gap-6 p-6">
          <ShieldCheck className="h-8 w-8 text-primary" aria-hidden="true" />
          <PasswordSignInForm />
          <div className="border-t border-black/10 pt-6">
            <p className="mb-4 text-sm font-bold text-black/70">Ou recevoir un lien magique</p>
            <AuthForm />
          </div>
          <p className="text-sm leading-6 text-black/75">
            En continuant, tu accèdes à ton espace personnel Yobalelma.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/auth/sign-up" className="text-sm font-bold text-primary">
              Créer un compte
            </Link>
            <Link href="/auth/forgot-password" className="text-sm font-bold text-primary">
              Mot de passe oublié
            </Link>
          </div>
          <Link href="/" className="text-sm font-bold text-primary">
            Retour à l&apos;accueil
          </Link>
        </PremiumPanel>
        </div>
    </PageShell>
  );
}
