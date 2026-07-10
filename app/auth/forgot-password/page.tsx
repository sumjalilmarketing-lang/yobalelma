import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/password-auth-forms";
import { PageShell } from "@/components/layout/page-shell";

export const metadata = {
  title: "Mot de passe oublie | Yobalelma",
};

export default function ForgotPasswordPage() {
  return (
    <PageShell
      eyebrow="Securite"
      title="Reinitialiser ton mot de passe"
      description="Indique ton email. Si un compte existe, Supabase enverra un lien securise."
    >
      <div className="mx-auto grid max-w-xl gap-6 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <ForgotPasswordForm />
        <Link href="/auth/sign-in" className="text-sm font-bold text-primary">
          Retour a la connexion
        </Link>
      </div>
    </PageShell>
  );
}

