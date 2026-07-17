import Image from "next/image";
import { redirect } from "next/navigation";
import { LocalizationSwitcher } from "@/components/i18n/localization-switcher";
import { getHubSession, demoHubAccounts } from "@hub-app/src/lib/auth";
import { Field, inputClass, selectClass, submitClass } from "@hub-app/src/components/hub-ui";

export default async function HubSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const session = await getHubSession();
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/hub";
  const demoAuthEnabled = process.env.NODE_ENV !== "production" || process.env.HUB_ENABLE_DEMO_AUTH === "1";

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
            <h1 className="mt-4 text-4xl font-black tracking-normal md:text-6xl">Controler chaque colis avant le voyage.</h1>
            <p className="mt-5 text-base font-semibold text-white/70 md:text-lg">
              Reception, inspection, inventaire, capacite, lots et remise voyageur avec tracabilite complete.
            </p>
          </div>
          <div className="grid gap-3 text-sm font-bold text-white/70 md:grid-cols-3">
            <span>QR opaque</span>
            <span>Audit logs</span>
            <span>RLS preparee</span>
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg rounded-lg border border-black/10 bg-white p-6 shadow-panel">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Acces protege</p>
              <h2 className="mt-2 text-3xl font-black">Connexion Hub</h2>
            </div>
            <LocalizationSwitcher />
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
            <button className={submitClass} type="submit">Entrer avec Supabase</button>
          </form>

          {demoAuthEnabled ? <><div className="my-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-px flex-1 bg-black/10" />
            Mode demonstration
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <form action="/api/auth/hub-sign-in" className="grid gap-4" method="post">
            <input name="returnTo" type="hidden" value={nextPath} />
            <Field label="Compte test">
              <select className={selectClass} name="email" defaultValue={demoHubAccounts[0].email}>
                {demoHubAccounts.map((account) => (
                  <option key={account.email} value={account.email}>{account.name} - {account.email}</option>
                ))}
              </select>
            </Field>
            <Field label="Role">
              <select className={selectClass} name="role" defaultValue="hub_agent">
                <option value="hub_agent">hub_agent</option>
                <option value="hub_supervisor">hub_supervisor</option>
                <option value="hub_manager">hub_manager</option>
                <option value="operations_manager">operations_manager</option>
              </select>
            </Field>
            <Field label="Code operateur">
              <input className={inputClass} name="code" defaultValue="HUB-AGENT" />
            </Field>
            <button className={submitClass} type="submit">Entrer dans le Hub</button>
          </form>
          <div className="mt-5 rounded-md bg-muted p-3 text-xs font-bold text-muted-foreground">
            Comptes fictifs uniquement: HUB-AGENT, HUB-SUPERVISOR, HUB-MANAGER, OPS-READ.
          </div>
          </> : null}
        </div>
      </section>
    </main>
  );
}
