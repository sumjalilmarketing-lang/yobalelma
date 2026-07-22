import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdminSession } from "@admin-app/src/lib/auth";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const [session, params] = await Promise.all([getAdminSession(), searchParams]);
  if (session) redirect("/command");
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//") && !params.next.includes("\\") ? params.next : "/command";
  return <main className="yb-auth-layout grid lg:grid-cols-[1.08fr_.92fr]">
    <section className="yb-auth-visual hidden p-12 lg:block">
      <div className="command-grid absolute inset-0 opacity-30" />
      <div className="relative flex min-h-full flex-col justify-between">
        <div className="flex items-center gap-3"><Image src="/brand/yobalelma-mark.svg" alt="Yobalelma" width={48} height={48} priority /><div><strong className="text-xl">Yobalelma</strong><p className="text-xs font-black uppercase tracking-[.2em] text-primary">Centre de commandement</p></div></div>
        <div className="yb-auth-copy"><p className="text-xs font-black uppercase tracking-[.24em] text-primary">Organisation orchestrée</p><h1 className="yb-auth-title mt-4">Chaque métier sait quoi faire, quand et pourquoi.</h1><p className="yb-auth-description mt-6">Missions, responsabilités, validations et décisions réunies dans un espace opérationnel sécurisé.</p></div>
        <div className="yb-auth-features"><span className="yb-auth-feature">Responsabilités claires</span><span className="yb-auth-feature">Workflows maîtrisés</span><span className="yb-auth-feature">Décisions auditables</span></div>
      </div>
    </section>
    <section className="yb-auth-content"><div className="yb-auth-card text-black">
      <p className="yb-eyebrow">Accès collaborateurs</p><h2 className="yb-title mt-2">Centre de commandement</h2><p className="mt-2 text-sm font-medium text-muted-foreground">Utilisez votre accès professionnel Yobalelma.</p>
      {params.error ? <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{params.error}</p> : null}
      <form action="/api/auth/sign-in" className="mt-6 grid gap-4" method="post"><input name="returnTo" type="hidden" value={nextPath} /><label className="yb-label">Email professionnel<input className="yb-field" name="email" type="email" autoComplete="email" required /></label><label className="yb-label">Mot de passe<input className="yb-field" name="password" type="password" autoComplete="current-password" required /></label><button className="yb-button yb-button-primary w-full" type="submit">Ouvrir le centre de commandement</button></form>
    </div></section>
  </main>;
}
