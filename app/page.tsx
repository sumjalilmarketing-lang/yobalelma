import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PackageCheck, Plane, Route, ShieldCheck } from "lucide-react";
import { YobalelmaLogo } from "@/components/brand/yobalelma-logo";
import { Button } from "@/components/ui/button";

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
  { label: "Trajets vérifiés", icon: Route },
  { label: "Colis suivis", icon: PackageCheck },
  { label: "Identités contrôlées", icon: ShieldCheck },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      <section className="relative isolate overflow-hidden bg-black text-white">
        <div className="absolute inset-0 -z-10 opacity-35">
          <Image
            src="/brand/yobalelma-route.svg"
            alt=""
            fill
            priority
            className="object-cover"
          />
        </div>
        <div className="container flex min-h-[92vh] flex-col">
          <header className="flex items-center justify-between py-6">
            <YobalelmaLogo className="text-white" />
            <div className="hidden items-center gap-3 text-sm text-white/72 sm:flex">
              <Plane className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Europe, Afrique et diaspora</span>
            </div>
          </header>

          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="max-w-3xl">
              <p className="mb-5 inline-flex rounded-full border border-white/18 bg-white/8 px-4 py-2 text-sm font-medium text-white/82">
                Livraison collaborative par voyageurs
              </p>
              <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-normal text-white sm:text-6xl lg:text-7xl">
                Chaque voyage devient une livraison
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/76 sm:text-xl">
                Yobalelma connecte les personnes qui voyagent avec celles qui
                veulent envoyer un colis, dans un cadre simple, contrôlé et
                transparent.
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

            <div className="relative hidden min-h-[470px] lg:block">
              <div className="absolute inset-x-10 top-6 h-80 rotate-[-3deg] rounded-[28px] border border-white/14 bg-white p-5 text-black shadow-crisp">
                <div className="flex items-center justify-between border-b border-black/10 pb-4">
                  <YobalelmaLogo compact />
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                    Prêt
                  </span>
                </div>
                <div className="mt-8 space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/44">
                      Trajet
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full bg-primary" />
                      <div>
                        <p className="text-xl font-black">Paris</p>
                        <p className="text-sm text-black/54">Départ voyageur</p>
                      </div>
                    </div>
                    <div className="ml-1.5 h-10 w-px bg-black/12" />
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full bg-black" />
                      <div>
                        <p className="text-xl font-black">Dakar</p>
                        <p className="text-sm text-black/54">Remise colis</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-black p-4 text-white">
                    <p className="text-sm text-white/58">Colis disponible</p>
                    <p className="mt-1 text-2xl font-black">2,5 kg</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 pb-7 sm:grid-cols-3">
            {trustSignals.map((signal) => (
              <div
                key={signal.label}
                className="flex items-center gap-3 border-t border-white/15 pt-4 text-sm font-semibold text-white/78"
              >
                <signal.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                {signal.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="container grid gap-7 py-12 md:grid-cols-3 md:py-16"
        aria-label="Accès rapides Yobalelma"
      >
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex min-h-36 flex-col justify-between rounded-lg border border-black/10 bg-white p-5 transition hover:border-primary hover:shadow-crisp"
          >
            <span className="text-sm font-bold text-black/50">Yobalelma</span>
            <span className="flex items-center justify-between gap-4 text-xl font-black">
              {action.label}
              <ArrowRight
                className="h-5 w-5 text-primary transition group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
