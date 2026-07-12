import Link from "next/link";
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
      <div className="mx-auto grid max-w-3xl gap-6 rounded-lg border border-black/10 bg-white p-6 shadow-line">
        <SignUpForm />
        <Link href="/auth/sign-in" className="text-sm font-bold text-primary">
          J&apos;ai deja un compte
        </Link>
      </div>
    </PageShell>
  );
}
