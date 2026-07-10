import Link from "next/link";
import { AuthForm } from "@/components/forms/auth-form";
import { PageShell } from "@/components/layout/page-shell";

export const metadata = {
  title: "Connexion | Yobalelma",
};

export default function SignInPage() {
  return (
    <PageShell
      eyebrow="Compte"
      title="Connexion securisee"
      description="Reçois un lien magique par email pour acceder a ton espace Yobalelma."
    >
      <div className="mx-auto grid max-w-xl gap-6 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <AuthForm />
        <p className="text-sm leading-6 text-black/58">
          En continuant, tu rejoins la plateforme Yobalelma. Les donnees sont
          rattachees au projet Supabase Yobalelma uniquement.
        </p>
        <Link href="/" className="text-sm font-bold text-primary">
          Retour a l&apos;accueil
        </Link>
      </div>
    </PageShell>
  );
}
