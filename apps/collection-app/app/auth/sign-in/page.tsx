import Image from "next/image";
import { redirect } from "next/navigation";
import { demoCollectionAccounts, getCollectionSession } from "@collection-app/src/lib/auth";

const input = "yb-field text-sm font-semibold";
const roleLabels = { collection_driver: "Agent de collecte", collection_supervisor: "Superviseur Collection", collection_manager: "Responsable Collection", operations_manager: "Responsable des opérations" } as const;

export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const session = await getCollectionSession();
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//") && !params.next.includes("\\") ? params.next : "/collection";
  if (session) redirect(nextPath);
  const demo = process.env.NODE_ENV !== "production";

  return <main className="yb-auth-layout grid lg:grid-cols-[1.08fr_.92fr]">
    <section className="yb-auth-visual hidden p-7 lg:block lg:p-12">
      <div className="collection-grid absolute inset-0 opacity-30" />
      <div className="relative flex min-h-full flex-col justify-between">
        <div className="flex items-center gap-3"><span className="grid h-12 w-20 place-items-center rounded-xl bg-white p-1"><Image src="/brand/yobalelma-mark.svg" alt="Yobalelma" width={72} height={40} priority /></span><div><strong className="text-xl">Yobalelma</strong><p className="text-xs font-black uppercase tracking-[.2em] text-primary">Collection</p></div></div>
        <div className="yb-auth-copy"><p className="yb-eyebrow">Transport interne</p><h1 className="yb-auth-title mt-4">Chaque mouvement, tracé du relais au Hub.</h1><p className="yb-auth-description mt-6">Missions optimisées, navigation en temps réel, scan sécurisé et continuité hors ligne pour les équipes terrain.</p></div>
        <div className="yb-auth-features"><span className="yb-auth-feature">Parcours maîtrisés</span><span className="yb-auth-feature">Scan sécurisé</span><span className="yb-auth-feature">Continuité terrain</span></div>
      </div>
    </section>
    <section className="yb-auth-content"><div className="yb-auth-card">
      <div className="mb-6"><p className="yb-eyebrow">Accès sécurisé</p><h2 className="yb-title mt-2">Connexion Collection</h2><p className="mt-2 text-sm font-medium text-muted-foreground">Retrouvez votre tournée et vos contrôles terrain.</p></div>
      {params.error ? <p className="mb-4 rounded-lg bg-error/10 p-3 text-sm font-bold text-error" role="alert">{params.error}</p> : null}
      <form action="/api/auth/supabase-sign-in" className="grid gap-4" method="post"><input name="returnTo" type="hidden" value={nextPath} /><label className="yb-label">Email professionnel<input className={input} name="email" type="email" autoComplete="email" required /></label><label className="yb-label">Mot de passe<input className={input} name="password" type="password" autoComplete="current-password" required /></label><button className="yb-button yb-button-primary w-full" type="submit">Ouvrir ma tournée</button></form>
      {demo ? <><div className="yb-form-divider my-6">Accès de formation</div><form action="/api/auth/collection-sign-in" className="grid gap-3" method="post"><input name="returnTo" type="hidden" value={nextPath} /><label className="yb-label">Profil de formation<select className={input} name="email" defaultValue={demoCollectionAccounts[0].email}>{demoCollectionAccounts.map((account) => <option key={account.email} value={account.email}>{account.name} — {roleLabels[account.role]}</option>)}</select></label><label className="yb-label">Responsabilité<select className={input} name="role" defaultValue="collection_driver"><option value="collection_driver">Agent de collecte</option><option value="collection_manager">Responsable Collection</option><option value="operations_manager">Responsable des opérations</option></select></label><label className="yb-label">Identifiant de formation<input className={input} name="code" defaultValue="COL-DRIVER" /></label><button className="yb-button yb-button-secondary w-full" type="submit">Découvrir l’espace Collection</button></form></> : null}
    </div></section>
  </main>;
}
