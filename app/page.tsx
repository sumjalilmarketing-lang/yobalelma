import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Globe2,
  PackageCheck,
  Plane,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { YobalelmaLogo } from "@/components/brand/yobalelma-logo";
import { Button } from "@/components/ui/button";
import {
  DestinationModeGrid,
  JourneyVisualStage,
  SceneBackdrop,
  SceneMetricRail,
  roleWorldCards,
} from "@/components/visual/yobalelma-world";

const actions = [
  {
    label: "Envoyer un colis",
    href: "/envoyer",
    variant: "default" as const,
  },
  {
    label: "Devenir livreur",
    href: "/livreur",
    variant: "secondary" as const,
  },
  {
    label: "Voyager avec Yobalelma",
    href: "/voyager",
    variant: "outline" as const,
  },
];

const trustSignals = [
  { label: "Trajets verifies", icon: Route },
  { label: "Colis suivis", icon: PackageCheck },
  { label: "Identites controlees", icon: ShieldCheck },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-black">
      <section className="relative isolate overflow-hidden bg-secondary text-white">
        <SceneBackdrop scene="home" />
        <div className="absolute inset-0 yb-pattern opacity-20" aria-hidden />
        <div className="container relative flex min-h-[92vh] flex-col">
          <header className="flex items-center justify-between gap-4 py-6">
            <Link href="/" aria-label="Accueil Yobalelma">
              <YobalelmaLogo className="text-white" />
            </Link>
            <div className="hidden items-center gap-3 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-white/75 backdrop-blur sm:flex">
              <Plane className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Afrique, Europe et diaspora</span>
            </div>
          </header>

          <div className="flex flex-1 flex-col justify-center py-10">
            <div className="max-w-5xl">
              <div className="mb-6 max-w-[430px] overflow-hidden rounded-lg border border-white/20 bg-black/70 p-2 shadow-panel backdrop-blur">
                <Image
                  src="/brand/yobalelma-official-lockup.jpeg"
                  alt="Yobalelma - Chaque voyage devient une livraison"
                  width={1210}
                  height={650}
                  priority
                  className="h-auto w-full rounded-md object-contain"
                />
              </div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white/80 backdrop-blur">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                Livraison collaborative par voyageurs
              </p>
              <h1 className="max-w-5xl text-5xl font-black leading-[0.98] tracking-normal text-white sm:text-6xl lg:text-7xl">
                Chaque voyage devient une livraison
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75 sm:text-xl">
                Yobalelma relie expediteurs, voyageurs, livreurs, relais et hubs dans
                une experience premium, controlee et transparente.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {actions.map((action) => (
                  <Button key={action.label} asChild size="lg" variant={action.variant}>
                    <Link href={action.href}>
                      {action.label}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            <SceneMetricRail scene="home" className="mt-12 max-w-4xl" />
          </div>

          <div className="grid gap-3 pb-7 sm:grid-cols-3">
            {trustSignals.map((signal) => (
              <div
                key={signal.label}
                className="flex items-center gap-3 border-t border-white/20 pt-4 text-sm font-semibold text-white/80"
              >
                <signal.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                {signal.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16" aria-label="Acces rapides Yobalelma">
        <div className="container grid gap-4 md:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex min-h-40 flex-col justify-between rounded-lg border border-black/10 bg-white p-5 shadow-line transition hover:-translate-y-1 hover:border-primary/70 hover:shadow-panel"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-primary">
                <Globe2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex items-center justify-between gap-4 text-xl font-black">
                {action.label}
                <ArrowRight
                  className="h-5 w-5 text-primary transition group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-black/10 bg-white py-12 md:py-16">
        <div className="container grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-primary">Mode pays</p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
              Une interface qui reconnait les destinations et leur contexte.
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-black/60">
              Le produit peut afficher une ambiance visuelle differente selon les villes,
              pays et continents, sans masquer les actions operationnelles.
            </p>
          </div>
          <DestinationModeGrid />
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase text-primary">Espaces metiers</p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
              Chaque role garde sa propre ambiance sans perdre la meme exigence produit.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roleWorldCards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.title}
                  className="relative min-h-60 overflow-hidden rounded-lg border border-black/10 bg-white p-5 shadow-line"
                >
                  <SceneBackdrop scene={card.scene} muted className="opacity-80" />
                  <div className="relative flex h-full flex-col justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-primary shadow-panel">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-2xl font-black">{card.title}</h3>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-black/60">{card.text}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-12 text-white md:py-16">
        <div className="container grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-primary">Pilotage</p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
              La meme qualite visuelle pour le terrain, les airs et le back-office.
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-white/70">
              Les dashboards reprennent cette grammaire: cartes de routes, signaux de
              statut, metriques, scans QR et preuves.
            </p>
          </div>
          <JourneyVisualStage scene="operations" />
        </div>
      </section>
    </main>
  );
}
