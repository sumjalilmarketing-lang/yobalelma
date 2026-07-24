import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-background p-6">
    <section className="max-w-lg rounded-2xl border bg-card p-8 text-center shadow-xl">
      <p className="text-xs font-black uppercase tracking-[.18em] text-primary">Périmètre protégé</p>
      <h1 className="mt-3 text-3xl font-black">Cet espace n’est pas disponible</h1>
      <p className="mt-3 text-sm text-muted-foreground">Votre responsabilité actuelle ne permet pas d’ouvrir cette direction, ou la page demandée n’existe plus.</p>
      <Link href="/command" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 font-black text-primary-foreground">Retour au centre de commandement</Link>
    </section>
  </main>;
}
