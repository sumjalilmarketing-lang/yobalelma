import Image from "next/image";

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/command";
  return <main className="grid min-h-screen place-items-center bg-background p-6">
    <section className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-xl">
      <Image src="/brand/yobalelma-mark.svg" alt="Yobalelma" width={56} height={56} priority />
      <p className="mt-6 text-xs font-black uppercase tracking-[.18em] text-primary">Protection renforcée</p>
      <h1 className="mt-2 text-3xl font-black">Confirmez votre identité</h1>
      <p className="mt-3 text-sm text-muted-foreground">Saisissez le code à six chiffres de votre application d’authentification.</p>
      <form action="/api/auth/mfa/verify" method="post" className="mt-6 grid gap-4">
        <input type="hidden" name="returnTo" value={next} />
        <label className="grid gap-2 text-sm font-bold">Code de sécurité
          <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required className="h-12 rounded-xl border bg-background px-4 text-center text-xl font-black tracking-[.35em]" />
        </label>
        {params.error ? <p role="alert" className="text-sm font-semibold text-destructive">Le code n’a pas pu être vérifié. Demandez un nouveau code et réessayez.</p> : null}
        <button className="h-12 rounded-xl bg-primary px-4 font-black text-primary-foreground" type="submit">Valider la connexion</button>
      </form>
    </section>
  </main>;
}
