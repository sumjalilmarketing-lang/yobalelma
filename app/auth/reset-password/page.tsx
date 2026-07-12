import { ResetPasswordForm } from "@/components/forms/password-auth-forms";
import { PageShell } from "@/components/layout/page-shell";

export const metadata = {
  title: "Nouveau mot de passe | Yobalelma",
};

export default function ResetPasswordPage() {
  return (
    <PageShell
      eyebrow="Securite"
      title="Choisir un nouveau mot de passe"
      description="Cette page est accessible apres le lien securise envoye par email."
    >
      <div className="mx-auto grid max-w-xl gap-6 rounded-lg border border-black/10 bg-white p-6 shadow-line">
        <ResetPasswordForm />
      </div>
    </PageShell>
  );
}
