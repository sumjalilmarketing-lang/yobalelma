import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdminSession } from "@admin-app/src/lib/auth";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const [session, params] = await Promise.all([getAdminSession(), searchParams]);
  if (session) redirect("/command");
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//") && !params.next.includes("\\") ? params.next : "/command";
  return <main className="grid min-h-screen lg:grid-cols-[1.08fr_.92fr]">
    <section className="relative hidden overflow-hidden bg-black p-12 text-white lg:block">
      <div className="command-grid absolute inset-0 opacity-30" />
      <div className="relative flex min-h-full flex-col justify-between">
        <div className="flex items-center gap-3"><Image src="/brand/yobalelma-mark.svg" alt="Yobalelma" width={48} height={48} priority /><div><strong className="text-xl">Yobalelma</strong><p className="text-xs font-black uppercase tracking-[.2em] text-primary">Centre de commandement</p></div></div>
        <div className="max-w-2xl py-14"><p className="text-xs font-black uppercase tracking-[.24em] text-primary">Organisation orchestrée</p><h1 className="mt-4 text-4xl font-black md:text-6xl">Chaque métier sait quoi faire, quand et pourquoi.</h1><p className="mt-5 text-lg font-semibold text-white/70">Missions, responsabilités, validations et décisions réunies dans un espace opérationnel sécurisé.</p></div>
        <div className="grid grid-cols-3 gap-3 text-xs font-black text-white/65"><span>Responsabilités claires</span><span>Workflows maîtrisés</span><span>Décisions auditables</span></div>
      </div>
    </section>
    <section className="flex min-h-screen items-center justify-center p-4"><div className="w-full max-w-lg rounded-xl border bg-white p-6 text-black shadow-panel">
      <p className="text-xs font-black uppercase tracking-[.18em] text-primary">Accès collaborateurs</p><h2 className="mt-2 text-3xl font-black">Centre de commandement</h2><p className="mt-2 text-sm text-black/60">Utilisez votre accès professionnel Yobalelma.</p>
      {params.error ? <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{params.error}</p> : null}
      <form action="/api/auth/sign-in" className="mt-6 grid gap-4" method="post"><input name="returnTo" type="hidden" value={nextPath} /><label className="grid gap-1 text-sm font-bold">Email professionnel<input className="h-11 rounded-lg border px-3" name="email" type="email" required /></label><label className="grid gap-1 text-sm font-bold">Mot de passe<input className="h-11 rounded-lg border px-3" name="password" type="password" required /></label><button className="h-11 rounded-lg bg-primary font-black text-white" type="submit">Ouvrir le centre de commandement</button></form>
    </div></section>
  </main>;
}
