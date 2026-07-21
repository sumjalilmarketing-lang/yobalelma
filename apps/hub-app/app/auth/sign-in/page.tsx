import Image from "next/image";
import { redirect } from "next/navigation";
import { getHubSession, demoHubAccounts } from "@hub-app/src/lib/auth";
import { Field, inputClass, selectClass, submitClass } from "@hub-app/src/components/hub-ui";

export default async function HubSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const session = await getHubSession();
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//") && !params.next.includes("\\") ? params.next : "/hub";
  const demoAuthEnabled = process.env.NODE_ENV !== "production";

  if (session) {
    redirect(nextPath);
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative overflow-hidden bg-black p-6 text-white lg:p-10">
        <div className="hub-grid absolute inset-0 opacity-25" />
        <div className="hub-skyline absolute inset-x-0 bottom-0 h-36 opacity-25" />
        <div className="relative flex min-h-full flex-col justify-between">
          <Image
            alt="Yobalelma"
            className="h-auto w-52 rounded-lg border border-white/10 bg-black"
            height={120}
            priority
            src="/brand/yobalelma-official-wordmark.jpeg"
            width={420}
          />
          <div className="max-w-2xl py-12">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Hub logistique</p>
            <h1 className="mt-4 text-4xl font-black tracking-normal md:text-6xl">Contrôler chaque colis avant le voyage.</h1>
            <p className="mt-5 text-base font-semibold text-white/70 md:text-lg">
              Réception, inspection, inventaire, capacité, lots et remise voyageur avec une traçabilité complète.
            </p>
          </div>
          <div className="grid gap-3 text-sm font-bold text-white/70 md:grid-cols-3">
            <span>Scans sécurisés</span>
            <span>Décisions traçables</span>
            <span>Accès maîtrisés</span>
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg rounded-lg border border-black/10 bg-white p-6 shadow-panel">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Accès protégé</p>
              <h2 className="mt-2 text-3xl font-black">Connexion Hub</h2>
            </div>
          </div>
          {params.error ? (
            <div className="mb-4 rounded-md border border-error/25 bg-error/10 p-3 text-sm font-bold text-error">
              {params.error}
            </div>
          ) : null}
          <form action="/api/auth/supabase-sign-in" className="grid gap-4" method="post">
            <input name="returnTo" type="hidden" value={nextPath} />
            <Field label="Email professionnel">
              <input className={inputClass} name="email" type="email" autoComplete="email" />
            </Field>
            <Field label="Mot de passe">
              <input className={inputClass} name="password" type="password" autoComplete="current-password" />
            </Field>
            <button className={submitClass} type="submit">Ouvrir ma session</button>
          </form>

          {demoAuthEnabled ? <><div className="my-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-px flex-1 bg-black/10" />
            Accès de formation
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <form action="/api/auth/hub-sign-in" className="grid gap-4" method="post">
            <input name="returnTo" type="hidden" value={nextPath} />
            <Field label="Profil de formation">
              <select className={selectClass} name="email" defaultValue={demoHubAccounts[0].email}>
                {demoHubAccounts.map((account) => (
                  <option key={account.email} value={account.email}>{account.name} - {account.email}</option>
                ))}
              </select>
            </Field>
            <Field label="Responsabilité">
              <select className={selectClass} name="role" defaultValue="hub_agent">
                <option value="hub_agent">Agent Hub</option>
                <option value="hub_supervisor">Superviseur Hub</option>
                <option value="hub_manager">Responsable Hub</option>
                <option value="operations_manager">Responsable des opérations</option>
              </select>
            </Field>
            <Field label="Identifiant de formation">
              <input className={inputClass} name="code" defaultValue="HUB-AGENT" />
            </Field>
            <button className={submitClass} type="submit">Entrer dans le Hub</button>
          </form>
          <div className="mt-5 rounded-md bg-muted p-3 text-xs font-bold text-muted-foreground">
            Ces profils sont réservés à la découverte et à la formation des équipes Yobalelma.
          </div>
          </> : null}
        </div>
      </section>
    </main>
  );
}
