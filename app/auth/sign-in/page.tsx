import Link from "next/link";
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
      <div className="mx-auto grid max-w-xl gap-6 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <PasswordSignInForm />
        <div className="border-t border-black/10 pt-6">
          <p className="mb-4 text-sm font-bold text-black/52">Ou recevoir un lien magique</p>
          <AuthForm />
        </div>
        <p className="text-sm leading-6 text-black/58">
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
      </div>
    </PageShell>
  );
}

