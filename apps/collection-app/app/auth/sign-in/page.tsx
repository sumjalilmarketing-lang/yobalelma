import Image from "next/image";
import { redirect } from "next/navigation";
import { demoCollectionAccounts, getCollectionSession } from "@collection-app/src/lib/auth";

const input = "yb-field text-sm font-semibold";
const roleLabels = { collection_driver: "Agent de collecte", collection_supervisor: "Superviseur Collection", collection_manager: "Responsable Collection", operations_manager: "Responsable des opérations" } as const;

export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const session = await getCollectionSession();
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/collection";
  if (session) redirect(nextPath);
  const demo = process.env.NODE_ENV !== "production" || process.env.COLLECTION_ENABLE_DEMO_AUTH === "1";

  return <main className="grid min-h-screen lg:grid-cols-[1.08fr_.92fr]">
    <section className="relative hidden overflow-hidden bg-black p-7 text-white lg:block lg:p-12">
      <div className="collection-grid absolute inset-0 opacity-30" />
      <div className="relative flex min-h-full flex-col justify-between">
        <div className="flex items-center gap-3"><span className="grid h-12 w-20 place-items-center rounded-xl bg-white p-1"><Image src="/brand/yobalelma-mark.svg" alt="Yobalelma" width={72} height={40} priority /></span><div><strong className="text-xl">Yobalelma</strong><p className="text-xs font-black uppercase tracking-[.2em] text-primary">Collection</p></div></div>
        <div className="max-w-2xl py-14"><p className="yb-eyebrow">Transport interne</p><h1 className="mt-4 text-4xl font-black md:text-6xl">Chaque mouvement, tracé du relais au Hub.</h1><p className="mt-5 text-lg font-semibold text-white/70">Missions optimisées, navigation en temps réel, scan sécurisé et continuité hors ligne pour les équipes terrain.</p></div>
        <div className="grid grid-cols-3 gap-3 text-xs font-black text-white/65"><span>Parcours maîtrisés</span><span>Scan sécurisé</span><span>Continuité terrain</span></div>
      </div>
    </section>
    <section className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:min-h-0"><div className="yb-card w-full max-w-lg p-5 sm:p-6">
      <div className="mb-6"><p className="yb-eyebrow">Accès sécurisé</p><h2 className="mt-2 text-3xl font-black">Connexion Collection</h2></div>
      {params.error ? <p className="mb-4 rounded-lg bg-error/10 p-3 text-sm font-bold text-error" role="alert">{params.error}</p> : null}
      <form action="/api/auth/supabase-sign-in" className="grid gap-4" method="post"><input name="returnTo" type="hidden" value={nextPath} /><label className="grid gap-1 text-sm font-bold">Email professionnel<input className={input} name="email" type="email" autoComplete="email" required /></label><label className="grid gap-1 text-sm font-bold">Mot de passe<input className={input} name="password" type="password" autoComplete="current-password" required /></label><button className="h-11 rounded-lg bg-primary font-black text-white shadow-glow" type="submit">Ouvrir ma tournée</button></form>
      {demo ? <><div className="my-5 flex items-center gap-3 text-xs font-black uppercase text-muted-foreground"><span className="h-px flex-1 bg-black/10" />Accès de formation<span className="h-px flex-1 bg-black/10" /></div><form action="/api/auth/collection-sign-in" className="grid gap-3" method="post"><input name="returnTo" type="hidden" value={nextPath} /><label className="grid gap-1 text-sm font-bold">Profil de formation<select className={input} name="email" defaultValue={demoCollectionAccounts[0].email}>{demoCollectionAccounts.map((account) => <option key={account.email} value={account.email}>{account.name} — {roleLabels[account.role]}</option>)}</select></label><label className="grid gap-1 text-sm font-bold">Responsabilité<select className={input} name="role" defaultValue="collection_driver"><option value="collection_driver">Agent de collecte</option><option value="collection_manager">Responsable Collection</option><option value="operations_manager">Responsable des opérations</option></select></label><label className="grid gap-1 text-sm font-bold">Identifiant de formation<input className={input} name="code" defaultValue="COL-DRIVER" /></label><button className="h-11 rounded-lg bg-black font-black text-white" type="submit">Découvrir l’espace Collection</button></form></> : null}
    </div></section>
  </main>;
}
